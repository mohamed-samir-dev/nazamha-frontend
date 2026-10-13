import { questionsRepository } from '../repositories/questionsRepository';
import { QuestionBank, Question } from '../types';

export const questionsService = {
  async getBanksByTeacherId(teacherId: string): Promise<QuestionBank[]> {
    return questionsRepository.getBanksByTeacherId(teacherId);
  },

  async addBank(bank: Omit<QuestionBank, 'id' | 'created_at'>): Promise<QuestionBank> {
    return questionsRepository.addBank(bank);
  },

  async updateBank(id: string, updates: Partial<QuestionBank>): Promise<QuestionBank> {
    return questionsRepository.updateBank(id, updates);
  },

  async duplicateBank(id: string): Promise<QuestionBank> {
    return questionsRepository.duplicateBank(id);
  },

  async deleteBank(id: string): Promise<void> {
    return questionsRepository.deleteBank(id);
  },

  async getQuestionsByBankId(bankId: string): Promise<Question[]> {
    return questionsRepository.getQuestionsByBankId(bankId);
  },

  async addQuestion(question: Omit<Question, 'id' | 'created_at'>): Promise<Question> {
    return questionsRepository.addQuestion(question);
  },

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question> {
    return questionsRepository.updateQuestion(id, updates);
  },

  async deleteQuestion(id: string): Promise<void> {
    return questionsRepository.deleteQuestion(id);
  },
};
