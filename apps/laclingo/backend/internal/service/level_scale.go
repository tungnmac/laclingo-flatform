package service

import (
	"fmt"
	"slices"
	"strings"
)

// Thang trình độ theo ngôn ngữ — nguồn chuẩn duy nhất ở backend (kiểm dữ liệu vào, quy đổi khi dựng từ / gợi ý AI, trả
// cho web vẽ ô chọn). Mã lưu nguyên văn trong DB (vocabularies.level, grammar_lessons.level, ...). Quy đổi giữa các thang
// qua thứ bậc chung 1..6 (CEFR A1=1 .. C2=6); JLPT chỉ có 5 bậc nên bậc 6 (C2) quy về N1. Giữ khớp hàm SQL level_rank
// (migration 000057) và lib/levels.ts ở web.

// cefrLevels — thang mặc định cho mọi ngôn ngữ không có thang riêng
var cefrLevels = []string{"A1", "A2", "B1", "B2", "C1", "C2"}

// levelScales — thang riêng, xếp từ thấp lên cao
var levelScales = map[string][]string{
	"ja": {"N5", "N4", "N3", "N2", "N1"},                               // JLPT
	"zh": {"HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"},             // HSK
	"ko": {"TOPIK1", "TOPIK2", "TOPIK3", "TOPIK4", "TOPIK5", "TOPIK6"}, // TOPIK
}

// LevelScale — các mã trình độ của ngôn ngữ, từ thấp lên cao (mã có vùng như "zh-TW" dùng thang của "zh"). Trả bản sao.
func LevelScale(languageID string) []string {
	base, _, _ := strings.Cut(strings.ToLower(strings.TrimSpace(languageID)), "-")
	if scale, ok := levelScales[base]; ok {
		return slices.Clone(scale)
	}
	return slices.Clone(cefrLevels)
}

// levelRank — thứ bậc chung 1..6 của 1 mã thuộc bất kỳ thang nào (mã không trùng nhau giữa các thang); 0 = mã lạ
func levelRank(level string) int {
	if i := slices.Index(cefrLevels, level); i >= 0 {
		return i + 1
	}
	for _, scale := range levelScales {
		if i := slices.Index(scale, level); i >= 0 {
			return i + 1
		}
	}
	return 0
}

// levelForRank — mã ở thang của ngôn ngữ ứng với thứ bậc chung (vượt thang thì lấy bậc cao nhất, vd C2 → N1)
func levelForRank(languageID string, rank int) string {
	scale := LevelScale(languageID)
	return scale[min(max(rank, 1), len(scale))-1]
}

// convertLevel — đổi mã trình độ (thang bất kỳ) sang thang của ngôn ngữ đích; mã lạ / rỗng → "" (để caller chọn mặc định)
func convertLevel(level, toLanguageID string) string {
	rank := levelRank(strings.ToUpper(strings.TrimSpace(level)))
	if rank == 0 {
		return ""
	}
	return levelForRank(toLanguageID, rank)
}

// isValidLevel — level đúng là 1 mã trong thang của ngôn ngữ (phân biệt hoa/thường, gọi sau normalizeLevel)
func isValidLevel(languageID, level string) bool {
	return slices.Contains(LevelScale(languageID), level)
}

// normalizeLevel chuẩn hoá (bỏ khoảng trắng, viết hoa) và kiểm level theo thang của ngôn ngữ; rỗng hợp lệ (cột cho
// phép NULL / caller tự đặt mặc định).
func normalizeLevel(languageID string, level *string) error {
	*level = strings.ToUpper(strings.TrimSpace(*level))
	if *level == "" || isValidLevel(languageID, *level) {
		return nil
	}
	return fmt.Errorf("trình độ %q không hợp lệ với ngôn ngữ này, chọn 1 trong: %s: %w",
		*level, strings.Join(LevelScale(languageID), ", "), ErrInvalidInput)
}
