package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"laclingo-backend/internal/repository/db"
)

// Worker dịch sẵn nội dung học sang các ngôn ngữ giao diện (xem content_translation.go): mỗi lượt so câu tiếng Việt
// hiện tại của từng nguồn với hash đã dịch → dịch câu thiếu / đã sửa theo lô qua AI rồi ghi content_translations.
// Nội dung mới / admin vừa sửa được dịch ở lượt kế tiếp; trong lúc chờ học viên thấy tiếng Việt.

const (
	contentTranslationInterval  = 10 * time.Minute
	contentTranslationBatchSize = 40 // số câu (đã gộp trùng) mỗi lần gọi AI, 1 ngôn ngữ đích mỗi lần
	// Lô lỗi (AI từ chối / trả sai định dạng) thì bỏ qua lô đó dịch tiếp — 1 lô hỏng không chặn mãi các lô sau; lỗi liền
	// chừng này lô (AI sập / hết hạn mức) thì dừng lượt, lượt sau thử lại
	contentTranslationMaxFailures = 3
)

type ContentTranslationRepository interface {
	ListContentTranslationHashes(ctx context.Context, arg db.ListContentTranslationHashesParams) ([]db.ListContentTranslationHashesRow, error)
	UpsertContentTranslations(ctx context.Context, arg db.UpsertContentTranslationsParams) error
	ListVocabularyTranslationSources(ctx context.Context) ([]db.ListVocabularyTranslationSourcesRow, error)
	ListTopicNameTranslationSources(ctx context.Context) ([]string, error)
	ListGrammarTopicTranslationSources(ctx context.Context) ([]db.ListGrammarTopicTranslationSourcesRow, error)
	ListGrammarLessonTranslationSources(ctx context.Context) ([]db.ListGrammarLessonTranslationSourcesRow, error)
	ListGrammarExerciseTranslationSources(ctx context.Context) ([]db.ListGrammarExerciseTranslationSourcesRow, error)
	ListGrammarAnswerTranslationSources(ctx context.Context) ([]string, error)
	ListClassTranslationSources(ctx context.Context) ([]db.ListClassTranslationSourcesRow, error)
}

// translationSourceRow — 1 dòng nguồn: values xếp đúng thứ tự fields của nguồn
type translationSourceRow struct {
	id     string
	values []string
}

// translationSource — 1 loại nội dung cần dịch (PR sau thêm ngữ pháp, nghe/nói... vào contentTranslationSources)
type translationSource struct {
	entity string
	fields []string
	// keepForeign: câu không có chữ cái riêng của tiếng Việt (vd lựa chọn "goes", "了", câu hỏi toàn tiếng Anh) ghi luôn
	// bản dịch = nguyên văn, không gửi AI — AI dịch 1 chữ ngoại ngữ đứng lẻ (vd "goes" → "去") là hỏng bài tập
	keepForeign bool
	list        func(ctx context.Context, repo ContentTranslationRepository) ([]translationSourceRow, error)
}

var contentTranslationSources = []translationSource{
	{
		entity: translationEntityVocabulary,
		fields: []string{translationFieldMeaning, translationFieldExampleMeaning},
		list: func(ctx context.Context, repo ContentTranslationRepository) ([]translationSourceRow, error) {
			rows, err := repo.ListVocabularyTranslationSources(ctx)
			out := make([]translationSourceRow, 0, len(rows))
			for _, r := range rows {
				out = append(out, translationSourceRow{id: r.ID, values: []string{r.Meaning, r.ExampleMeaning}})
			}
			return out, err
		},
	},
	{
		entity: translationEntityTopicName,
		fields: []string{translationFieldLabel},
		list: func(ctx context.Context, repo ContentTranslationRepository) ([]translationSourceRow, error) {
			names, err := repo.ListTopicNameTranslationSources(ctx)
			return dictionarySourceRows(names), err
		},
	},
	{
		entity: translationEntityGrammarTopic,
		fields: []string{translationFieldTitle, translationFieldDescription},
		list: func(ctx context.Context, repo ContentTranslationRepository) ([]translationSourceRow, error) {
			rows, err := repo.ListGrammarTopicTranslationSources(ctx)
			out := make([]translationSourceRow, 0, len(rows))
			for _, r := range rows {
				out = append(out, translationSourceRow{id: r.ID, values: []string{r.Title, r.Description}})
			}
			return out, err
		},
	},
	{
		entity: translationEntityGrammarLesson,
		fields: grammarLessonTranslationFields(),
		list: func(ctx context.Context, repo ContentTranslationRepository) ([]translationSourceRow, error) {
			rows, err := repo.ListGrammarLessonTranslationSources(ctx)
			out := make([]translationSourceRow, 0, len(rows))
			for _, r := range rows {
				// Câu trong content lấy bằng cùng hàm với lúc phủ bản dịch → hash khớp nhau
				values := append([]string{r.Title}, jsonTextFields(r.Content, grammarLessonContentKeys)...)
				out = append(out, translationSourceRow{id: r.ID, values: values})
			}
			return out, err
		},
	},
	{
		entity:      translationEntityGrammarExercise,
		fields:      []string{translationFieldQuestion, translationFieldExplanation},
		keepForeign: true,
		list: func(ctx context.Context, repo ContentTranslationRepository) ([]translationSourceRow, error) {
			rows, err := repo.ListGrammarExerciseTranslationSources(ctx)
			out := make([]translationSourceRow, 0, len(rows))
			for _, r := range rows {
				out = append(out, translationSourceRow{id: r.ID, values: []string{r.Question, r.Explanation}})
			}
			return out, err
		},
	},
	{
		// Mỗi đáp án / lựa chọn dịch thành 1 mục riêng — lựa chọn chỉ có chữ tiếng nước ngoài AI trả nguyên văn
		entity:      translationEntityGrammarAnswer,
		fields:      []string{translationFieldText},
		keepForeign: true,
		list: func(ctx context.Context, repo ContentTranslationRepository) ([]translationSourceRow, error) {
			texts, err := repo.ListGrammarAnswerTranslationSources(ctx)
			return dictionarySourceRows(texts), err
		},
	},
	{
		entity: translationEntityClass,
		fields: []string{translationFieldTitle, translationFieldDescription},
		list: func(ctx context.Context, repo ContentTranslationRepository) ([]translationSourceRow, error) {
			rows, err := repo.ListClassTranslationSources(ctx)
			out := make([]translationSourceRow, 0, len(rows))
			for _, r := range rows {
				out = append(out, translationSourceRow{id: r.ID, values: []string{r.Title, r.Description}})
			}
			return out, err
		},
	},
}

// dictionarySourceRows — nguồn kiểu từ điển: id = chính câu tiếng Việt, 1 ô duy nhất
func dictionarySourceRows(texts []string) []translationSourceRow {
	out := make([]translationSourceRow, 0, len(texts))
	for _, text := range texts {
		out = append(out, translationSourceRow{id: text, values: []string{text}})
	}
	return out
}

// contentLocaleNames — tên ngôn ngữ đích trong prompt AI
var contentLocaleNames = map[string]string{
	"en": "English",
	"zh": "Simplified Chinese",
	"ja": "Japanese",
	"ko": "Korean",
}

type contentTranslationWorker struct {
	repo      ContentTranslationRepository
	ai        AIClient
	sources   []translationSource
	locales   []string
	batchSize int
}

// StartContentTranslationWorker chạy tới khi ctx huỷ: dịch 1 lượt ngay khi khởi động rồi mỗi 10 phút. Chỉ gọi khi đã
// cấu hình AI.
func StartContentTranslationWorker(ctx context.Context, repo ContentTranslationRepository, ai AIClient) {
	w := &contentTranslationWorker{repo: repo, ai: ai, sources: contentTranslationSources, locales: contentLocales, batchSize: contentTranslationBatchSize}
	ticker := time.NewTicker(contentTranslationInterval)
	defer ticker.Stop()
	for {
		if err := w.runRound(ctx); err != nil && ctx.Err() == nil {
			log.Printf("❌ content translation: %v — thử lại lượt sau", err)
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

// pendingTranslation — 1 câu nguồn cần dịch và mọi ô (id, field) đang dùng câu đó
type pendingTranslation struct {
	text string
	hash string
	keys []translationKey // entity giống nhau, chỉ dùng id + field
}

// runRound — 1 lượt dịch mọi nguồn × mọi ngôn ngữ; lỗi DB / AI lỗi liền nhiều lô thì dừng lượt (lượt sau thử lại)
func (w *contentTranslationWorker) runRound(ctx context.Context) error {
	translated, failures := 0, 0
	defer func() {
		if translated > 0 {
			log.Printf("🌐 content translation: đã dịch %d câu", translated)
		}
	}()
	for _, src := range w.sources {
		rows, err := src.list(ctx, w.repo)
		if err != nil {
			return fmt.Errorf("đọc nguồn %s: %w", src.entity, err)
		}
		for _, locale := range w.locales {
			pending, err := w.pending(ctx, src, rows, locale)
			if err != nil {
				return err
			}
			if src.keepForeign {
				var foreign []pendingTranslation
				pending, foreign = splitForeign(pending)
				if len(foreign) > 0 {
					texts := make([]string, len(foreign))
					for i, p := range foreign {
						texts[i] = p.text
					}
					n, err := w.saveTranslations(ctx, src.entity, locale, foreign, texts)
					if err != nil {
						return err
					}
					translated += n
				}
			}
			for start := 0; start < len(pending); start += w.batchSize {
				batch := pending[start:min(start+w.batchSize, len(pending))]
				n, err := w.translateBatch(ctx, src.entity, locale, batch)
				translated += n
				if err == nil {
					failures = 0
					continue
				}
				err = fmt.Errorf("dịch %s sang %s: %w", src.entity, locale, err)
				if failures++; failures >= contentTranslationMaxFailures || ctx.Err() != nil {
					return err
				}
				log.Printf("⚠️  content translation: %v — bỏ qua lô này", err)
			}
		}
	}
	return nil
}

// pending — các câu của nguồn chưa có bản dịch ở locale hoặc bản dịch đã cũ (hash lệch), gộp câu trùng nhau
func (w *contentTranslationWorker) pending(ctx context.Context, src translationSource, rows []translationSourceRow, locale string) ([]pendingTranslation, error) {
	existing, err := w.repo.ListContentTranslationHashes(ctx, db.ListContentTranslationHashesParams{Entity: src.entity, Locale: locale})
	if err != nil {
		return nil, fmt.Errorf("đọc bản dịch %s/%s: %w", src.entity, locale, err)
	}
	have := make(map[translationKey]string, len(existing))
	for _, e := range existing {
		have[translationKey{src.entity, e.EntityID, e.Field}] = e.SourceHash
	}
	byText := map[string]int{}
	var out []pendingTranslation
	for _, r := range rows {
		for i, field := range src.fields {
			text := strings.TrimSpace(r.values[i])
			if text == "" {
				continue
			}
			k := translationKey{src.entity, r.id, field}
			hash := sourceHash(r.values[i]) // hash câu nguyên văn — Apply cũng so trên giá trị trong DB
			if have[k] == hash {
				continue
			}
			idx, ok := byText[r.values[i]]
			if !ok {
				idx = len(out)
				byText[r.values[i]] = idx
				out = append(out, pendingTranslation{text: r.values[i], hash: hash})
			}
			out[idx].keys = append(out[idx].keys, k)
		}
	}
	return out, nil
}

const contentTranslationSystemPrompt = `You translate learning content for LacLingo, an app where Vietnamese learners study foreign languages. The app's interface is being shown in another language, so the Vietnamese parts of each item must be shown in that target language.
- Translate ONLY the Vietnamese parts into the target language. Keep any text in other languages (Chinese, English, Japanese, Korean... sentences or words), blanks like ____, punctuation, numbers, emoji and placeholders exactly as they are.
- Keep it concise and natural, flashcard style: a short meaning stays a short meaning; never add explanations, notes, quotes or romanization.
- id: copy the item's id. Return exactly one entry per input item.`

var contentTranslationSchema = map[string]any{
	"type": "object",
	"properties": map[string]any{
		"items": map[string]any{
			"type": "array",
			"items": map[string]any{
				"type":                 "object",
				"properties":           map[string]any{"id": map[string]any{"type": "string"}, "text": map[string]any{"type": "string"}},
				"required":             []string{"id", "text"},
				"additionalProperties": false,
			},
		},
	},
	"required":             []string{"items"},
	"additionalProperties": false,
}

func contentTranslationUserPrompt(locale string, batch []pendingTranslation) string {
	var b strings.Builder
	fmt.Fprintf(&b, "Target language: %s\nItems (JSON, id → Vietnamese text):\n", contentLocaleNames[locale])
	items := make(map[string]string, len(batch))
	for i, p := range batch {
		items[strconv.Itoa(i)] = p.text
	}
	raw, _ := json.Marshal(items) // JSON: câu nhiều dòng / có ký tự đặc biệt không lẫn ranh giới giữa các mục
	b.Write(raw)
	return b.String()
}

// parseContentTranslations — bản dịch theo vị trí trong lô; mục thiếu / rỗng để "" (lượt sau dịch lại)
func parseContentTranslations(text string, n int) ([]string, error) {
	var out struct {
		Items []struct {
			ID   string `json:"id"`
			Text string `json:"text"`
		} `json:"items"`
	}
	if err := json.Unmarshal([]byte(strings.TrimSpace(text)), &out); err != nil {
		return nil, errAIBadFormat(err)
	}
	texts := make([]string, n)
	for _, it := range out.Items {
		i, err := strconv.Atoi(strings.TrimSpace(it.ID))
		if err != nil || i < 0 || i >= n {
			continue
		}
		texts[i] = strings.TrimSpace(it.Text)
	}
	return texts, nil
}

// vietnameseLetters — chữ cái chỉ tiếng Việt có (đ, ă/â/ê/ô/ơ/ư và nguyên âm mang dấu thanh)
const vietnameseLetters = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ"

// hasVietnamese — câu có ít nhất 1 chữ cái tiếng Việt có dấu. Câu tiếng Việt không dấu nào (vd "con", "ba") bị coi là
// ngoại ngữ và giữ nguyên — hiếm, chấp nhận để không gửi AI những câu chỉ có chữ của ngôn ngữ đang học.
func hasVietnamese(text string) bool {
	return strings.ContainsAny(strings.ToLower(text), vietnameseLetters)
}

// splitForeign tách các câu không có phần tiếng Việt (giữ nguyên văn) khỏi các câu cần AI dịch
func splitForeign(pending []pendingTranslation) (toAI, foreign []pendingTranslation) {
	for _, p := range pending {
		if hasVietnamese(p.text) {
			toAI = append(toAI, p)
		} else {
			foreign = append(foreign, p)
		}
	}
	return toAI, foreign
}

// translateBatch — 1 lần gọi AI cho 1 lô câu, ghi bản dịch cho mọi ô dùng các câu đó; trả số câu đã dịch
func (w *contentTranslationWorker) translateBatch(ctx context.Context, entity, locale string, batch []pendingTranslation) (int, error) {
	resp, err := w.ai.GenerateJSON(ctx, AIJSONRequest{
		System: contentTranslationSystemPrompt, User: contentTranslationUserPrompt(locale, batch),
		Schema: contentTranslationSchema, MaxTokens: 8192,
	})
	if err != nil {
		return 0, err
	}
	texts, err := parseContentTranslations(resp, len(batch))
	if err != nil {
		return 0, err
	}
	return w.saveTranslations(ctx, entity, locale, batch, texts)
}

// saveTranslations ghi bản dịch (theo vị trí, "" = bỏ qua) cho mọi ô dùng các câu đó; trả số câu đã ghi
func (w *contentTranslationWorker) saveTranslations(ctx context.Context, entity, locale string, batch []pendingTranslation, texts []string) (int, error) {
	params := db.UpsertContentTranslationsParams{Entity: entity, Locale: locale}
	n := 0
	for i, p := range batch {
		if texts[i] == "" {
			continue
		}
		n++
		for _, k := range p.keys {
			params.EntityIds = append(params.EntityIds, k.id)
			params.Fields = append(params.Fields, k.field)
			params.SourceHashes = append(params.SourceHashes, p.hash)
			params.Texts = append(params.Texts, texts[i])
		}
	}
	if n == 0 {
		return 0, nil
	}
	if err := w.repo.UpsertContentTranslations(ctx, params); err != nil {
		return 0, fmt.Errorf("ghi bản dịch: %w", err)
	}
	return n, nil
}
