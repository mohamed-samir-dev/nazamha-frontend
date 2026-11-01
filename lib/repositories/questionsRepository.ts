import { api } from "@/lib/apiClient";
import { QuestionBank, Question } from "@/lib/types";

export const questionsRepository = {
  async getBanksByTeacherId(_teacherId: string): Promise<QuestionBank[]> {
    return api.get<QuestionBank[]>("/question-banks");
  },

  async addBank(bank: Omit<QuestionBank, "id" | "created_at">): Promise<QuestionBank> {
    return api.post<QuestionBank>("/question-banks", bank);
  },

  async updateBank(id: string, updates: Partial<QuestionBank>): Promise<QuestionBank> {
    return api.put<QuestionBank>(`/question-banks/${id}`, updates);
  },

  async duplicateBank(id: string): Promise<QuestionBank> {
    return api.post<QuestionBank>(`/question-banks/${id}/duplicate`, {});
  },

  async deleteBank(id: string): Promise<void> {
    await api.delete(`/question-banks/${id}`);
  },

  async getQuestionsByBankId(bankId: string): Promise<Question[]> {
    return api.get<Question[]>(`/question-banks/${bankId}/questions`);
  },

  async addQuestion(question: Omit<Question, "id" | "created_at">): Promise<Question> {
    return api.post<Question>(`/question-banks/${question.bank_id}/questions`, question);
  },

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question> {
    return api.put<Question>(`/questions/${id}`, updates);
  },

  async deleteQuestion(id: string): Promise<void> {
    await api.delete(`/questions/${id}`);
  },

  async reorderQuestions(bankId: string, questionIds: string[]): Promise<void> {
    await api.put(`/question-banks/${bankId}/questions/reorder`, { questionIds });
  },

  async bulkUpdateMarks(bankId: string, marks: { id: string; marks: number }[]): Promise<void> {
    await api.put(`/question-banks/${bankId}/questions/marks`, { marks });
  },

  async uploadImage(file: File | Blob): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("image", file);
    return api.upload<{ url: string }>("/question-banks/upload-image", formData);
  },
};
