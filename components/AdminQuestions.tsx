import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import { getQuestionsBank, saveQuestion, deleteQuestion } from '../services/storageService';
import { generateQuestions } from '../services/geminiService';
import { Loader2, Plus, Trash2, RefreshCw } from 'lucide-react';

interface AdminQuestionsProps {
  onClose?: () => void;
}

export const AdminQuestions: React.FC<AdminQuestionsProps> = ({ onClose }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationCount, setGenerationCount] = useState(10);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | 'ADAPTIVE'>('MEDIUM');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const bank = await getQuestionsBank();
      setQuestions(bank);
    } catch (err) {
      console.error('Failed to load questions:', err);
      setMessage('Erreur: Impossible de charger les questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    setMessage('');
    try {
      const generated = await generateQuestions(generationCount, selectedDifficulty);
      for (const q of generated) {
        await saveQuestion(q);
      }
      setMessage(`✅ ${generationCount} questions générées et sauvegardées avec succès!`);
      await loadQuestions();
      setGenerationCount(10);
    } catch (err) {
      console.error('Failed to generate questions:', err);
      setMessage('❌ Erreur lors de la génération des questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette question?')) return;
    try {
      await deleteQuestion(id);
      setMessage('✅ Question supprimée');
      await loadQuestions();
    } catch (err) {
      console.error('Failed to delete question:', err);
      setMessage('❌ Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Generation Panel */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-emerald-600">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Générer des Questions IA</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de questions</label>
            <input
              type="number"
              min="1"
              max="50"
              value={generationCount}
              onChange={(e) => setGenerationCount(parseInt(e.target.value))}
              disabled={isGenerating}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulté</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as any)}
              disabled={isGenerating}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="EASY">Facile</option>
              <option value="MEDIUM">Moyen</option>
              <option value="HARD">Difficile</option>
              <option value="EXPERT">Expert</option>
              <option value="ADAPTIVE">Progressif</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerateQuestions}
              disabled={isGenerating}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
              Générer
            </button>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message}
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Banque de Questions ({questions.length})
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Aucune question disponible. Générez-en en utilisant le formulaire ci-dessus.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {questions.map((q, idx) => (
              <div key={q.id || idx} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{q.questionText}</p>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {q.options?.map((opt, i) => (
                        <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {i}: {opt.substring(0, 20)}...
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2 text-xs text-gray-500">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {q.difficulty || 'N/A'}
                      </span>
                      <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded">
                        Réponse: {q.correctAnswerIndex}
                      </span>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                        {q.source || 'MANUAL'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteQuestion(q.id!)}
                    className="text-red-600 hover:text-red-800 transition p-2"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
