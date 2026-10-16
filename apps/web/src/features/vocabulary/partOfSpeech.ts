// Từ loại — khớp partsOfSpeech ở backend (vocabulary_service.go). Viết tắt theo
// quy ước từ điển (n./v./adj./...), tên đầy đủ lấy từ i18n vocabCard.partOfSpeechNames.
export const PARTS_OF_SPEECH = ['noun', 'verb', 'adj', 'adv', 'pron', 'prep', 'conj', 'interj', 'det', 'num', 'phrase'] as const

export type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number]

export const PART_OF_SPEECH_ABBR: Record<PartOfSpeech, string> = {
  noun: 'n.',
  verb: 'v.',
  adj: 'adj.',
  adv: 'adv.',
  pron: 'pron.',
  prep: 'prep.',
  conj: 'conj.',
  interj: 'interj.',
  det: 'det.',
  num: 'num.',
  phrase: 'phr.',
}

export function isPartOfSpeech(value: string | undefined): value is PartOfSpeech {
  return !!value && (PARTS_OF_SPEECH as readonly string[]).includes(value)
}
