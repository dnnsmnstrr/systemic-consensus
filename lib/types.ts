export type Option = {
  id: number
  text: string
  scores: number[]
}

export type Decision = {
  id: string
  title: string
  options: Option[]
  user_count: number
  max_score: number
  veto_enabled: boolean
}
