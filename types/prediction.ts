export interface RiskFeature {
  feature_name: string
  shap_value: number
  feature_value: number
  impact: 'positive' | 'negative'
  abs_shap_value?: number
}

export interface Prediction {
  id: number
  defect_probability: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  top_risk_features: RiskFeature[]
  code_snippet: string
  file_path: string
  metrics?: {
    loc: number
    'v(g)': number
    'ev(g)': number
    'iv(g)': number
    branchCount: number
    num_functions: number
    num_classes: number
    num_imports: number
    maintainability_index: number
    lOCode: number
    lOComment: number
    lOBlank: number
  }
  created_at?: string
}

export interface Report {
  id: number
  title: string
  report_type: 'daily' | 'monthly' | 'custom'
  report_format: 'json' | 'xml' | 'pdf'
  created_at: string
}
