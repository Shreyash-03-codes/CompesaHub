export interface AssessmentTest {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'company_pattern' | 'topic';
  topic_tags: string[];
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_questions: number;
  max_score: number;
  is_published: boolean;
  created_by: string;
  created_at: string;
}

export interface Question {
  id: string;
  test_id: string;
  question_text: string;
  question_type: 'mcq' | 'code_display';
  code_snippet: string;
  options: string[];
  correct_options: number[];
  points: number;
  topic_tag: string;
  order: number;
}

export interface StudentAnswer {
  id: string;
  test_id: string;
  user_id: string;
  question_id: string;
  selected_options: number[];
  is_correct: boolean;
  submitted_at: string;
}

export interface TestSubmission {
  id: string;
  test_id: string;
  user_id: string;
  score: number;
  total: number;
  submitted_at: string;
  is_graded: boolean;
}

export interface DSAProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  problem_statement: string;
  constraints: string;
  sample_input: string;
  sample_output: string;
  function_signature: string;
  topic_tags: string[];
  max_points: number;
  created_by: string;
  created_at: string;
}

export interface DSAContest {
  id: string;
  title: string;
  description: string;
  problems: DSAProblem[];
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_published: boolean;
  created_by: string;
  created_at: string;
}

export interface DSASubmission {
  id: string;
  contest_id: string;
  problem_id: string;
  user_id: string;
  code: string;
  language: string;
  submitted_at: string;
  score: number;
  max_points: number;
  remarks: string;
  is_graded: boolean;
  graded_by: string;
  graded_at: string;
}
