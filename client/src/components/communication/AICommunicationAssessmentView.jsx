import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import Card from '../Card';
import Button from '../Button';
import Badge from '../Badge';
import LoadingState from '../LoadingState';
import EmptyState from '../EmptyState';
import {
  MessageSquare,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Clock,
  RotateCcw,
  ArrowRight,
  Briefcase,
  UserCheck,
  Building,
  Users,
  Presentation,
  Headphones,
  FileText,
  BarChart2,
  HelpCircle,
  Send,
  CheckCircle,
  Lightbulb,
  ShieldCheck,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';

const ASSESSMENT_TYPES = [
  {
    id: 'HR Interview',
    title: 'HR Interview',
    icon: Briefcase,
    color: 'from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-200',
    description: 'Behavioral, background, and cultural fitment questions for campus & industry placements.'
  },
  {
    id: 'Self Introduction',
    title: 'Self Introduction',
    icon: UserCheck,
    color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200',
    description: 'Master your professional 60–90 second elevator pitch for recruiters and panels.'
  },
  {
    id: 'Workplace Communication',
    title: 'Workplace Communication',
    icon: Building,
    color: 'from-purple-500/10 to-violet-500/10 text-purple-600 border-purple-200',
    description: 'Simulate cross-functional sprint syncs, milestone updates, and stakeholder negotiations.'
  },
  {
    id: 'Group Discussion',
    title: 'Group Discussion',
    icon: Users,
    color: 'from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-200',
    description: 'Practice initiating, counter-arguing, and moderating structured GD topic rounds.'
  },
  {
    id: 'Presentation Practice',
    title: 'Presentation Practice',
    icon: Presentation,
    color: 'from-rose-500/10 to-pink-500/10 text-rose-600 border-rose-200',
    description: 'Articulate technical architecture, project pitches, and executive executive summaries.'
  },
  {
    id: 'Customer/Client Communication',
    title: 'Customer/Client Communication',
    icon: Headphones,
    color: 'from-cyan-500/10 to-sky-500/10 text-cyan-600 border-cyan-200',
    description: 'Handle demanding clients, resolve project escalations, and manage expectations.'
  }
];

const DIFFICULTIES = [
  {
    id: 'Easy',
    label: 'Easy',
    desc: 'Supportive pacing with foundational situational prompts.',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    id: 'Medium',
    label: 'Medium',
    desc: 'Standard campus hiring panel level with realistic follow-up depth.',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    id: 'Hard',
    label: 'Hard',
    desc: 'High-stakes executive simulations with complex constraints & deadlines.',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
  }
];

const QUESTION_COUNT_PRESETS = [
  { count: 3, label: '3 Questions', time: '~5 mins', desc: 'Quick diagnostic' },
  { count: 5, label: '5 Questions', time: '~8 mins', desc: 'Standard practice' },
  { count: 10, label: '10 Questions', time: '~15 mins', desc: 'In-depth simulation' },
  { count: 15, label: '15 Questions', time: '~25 mins', desc: 'Comprehensive round' },
  { count: 20, label: '20 Questions', time: '~35 mins', desc: 'Exhaustive interview' }
];

export const AICommunicationAssessmentView = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('assessment'); // 'assessment' | 'history' | 'analytics'

  // Wizard / Session States
  const [step, setStep] = useState('landing'); // 'landing' | 'wizard' | 'conversation' | 'evaluating' | 'result'
  const [selectedType, setSelectedType] = useState('HR Interview');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
  const [selectedMode, setSelectedMode] = useState('Voice Mode'); // 'Voice Mode' | 'Text Mode'
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(3);
  const [customQuestionCount, setCustomQuestionCount] = useState('');
  const [isCustomCount, setIsCustomCount] = useState(false);

  // Active Assessment State
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [currentTurnNumber, setCurrentTurnNumber] = useState(1);
  const [targetTurns, setTargetTurns] = useState(3);
  const [dialogue, setDialogue] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [scenarioRole, setScenarioRole] = useState('Interviewer');
  const [scenarioContext, setScenarioContext] = useState('');
  const [studentInput, setStudentInput] = useState('');
  const [submittingTurn, setSubmittingTurn] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Voice Mode & Web Speech API States
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isSpeakingAI, setIsSpeakingAI] = useState(false);
  const [voiceAudioEnabled, setVoiceAudioEnabled] = useState(true);
  const recognitionRef = useRef(null);
  const speechBaseInputRef = useRef('');

  // History & Analytics States
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyStats, setHistoryStats] = useState({ totalAttempts: 0, averageScore: 0, bestScore: 0, trajectory: [] });
  const [pastAttempts, setPastAttempts] = useState([]);
  const [selectedPastAttempt, setSelectedPastAttempt] = useState(null);

  // Timer
  const [turnSeconds, setTurnSeconds] = useState(0);
  const timerRef = useRef(null);

  // Load history on mount & cleanup speech on unmount
  useEffect(() => {
    fetchHistory();
    checkSpeechSupport();

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Timer tick during conversation
  useEffect(() => {
    if (step === 'conversation') {
      timerRef.current = setInterval(() => {
        setTurnSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, currentTurnNumber]);

  // Speech Recognition Setup
  const checkSpeechSupport = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  };

  // Speak AI question using Text-to-Speech
  const speakText = (text) => {
    if (!voiceAudioEnabled || !('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeakingAI(true);
    utterance.onend = () => setIsSpeakingAI(false);
    utterance.onerror = () => setIsSpeakingAI(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeakingAI = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeakingAI(false);
    }
  };

  // Toggle Voice Input
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or switch to Text Mode.');
      return;
    }

    // Preserve any text already typed before speech recognition was started
    speechBaseInputRef.current = studentInput ? studentInput.trim() + ' ' : '';

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage('');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        // Iterate through all results to construct clean final + current interim text
        for (let i = 0; i < event.results.length; ++i) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += chunk + ' ';
          } else {
            interimTranscript += chunk;
          }
        }

        const sessionTranscript = (finalTranscript + interimTranscript).trim();
        const fullOutput = (speechBaseInputRef.current + sessionTranscript).replace(/\s+/g, ' ');
        setStudentInput(fullOutput);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setErrorMessage(`Microphone note: ${event.error}. You can also type directly in the text box.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setIsListening(false);
    }
  };

  // Fetch student history
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.getCommunicationHistory();
      if (res.success) {
        setHistoryStats(res.stats || { totalAttempts: 0, averageScore: 0, bestScore: 0, trajectory: [] });
        setPastAttempts(res.attempts || []);
      }
    } catch (err) {
      console.error('Error fetching communication history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Start Assessment Flow
  const handleStartAssessmentSession = async () => {
    setSubmittingTurn(true);
    setErrorMessage('');

    let finalCount = selectedQuestionCount;
    if (isCustomCount) {
      const parsed = parseInt(customQuestionCount, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 25) {
        setErrorMessage('Please enter a valid custom number of questions between 1 and 25.');
        setSubmittingTurn(false);
        return;
      }
      finalCount = parsed;
    }

    try {
      const res = await api.startCommunicationAssessment({
        assessmentType: selectedType,
        difficulty: selectedDifficulty,
        responseMode: selectedMode,
        questionCount: finalCount,
        targetTurns: finalCount
      });

      if (res.success && res.attempt) {
        setActiveAttempt(res.attempt);
        setCurrentTurnNumber(1);
        const resolvedTurns = res.attempt.questionCount || res.attempt.targetTurns || finalCount;
        setTargetTurns(resolvedTurns);
        setDialogue(res.attempt.dialogue || []);
        setCurrentQuestion(res.attempt.question || '');
        setScenarioRole(res.attempt.scenarioRole || 'Interviewer');
        setScenarioContext(res.attempt.scenarioContext || '');
        setStudentInput('');
        setTurnSeconds(0);
        setStep('conversation');

        // Play AI voice prompt if voice audio enabled
        if (voiceAudioEnabled) {
          setTimeout(() => speakText(res.attempt.question), 300);
        }
      } else {
        setErrorMessage(res.message || 'Failed to start communication session');
      }
    } catch (err) {
      console.error('Error starting communication assessment:', err);
      setErrorMessage(err.message || 'Network error occurred while contacting AI');
    } finally {
      setSubmittingTurn(false);
    }
  };

  // Submit Turn Response & Advance
  const handleSubmitTurnResponse = async () => {
    if (!studentInput.trim()) {
      setErrorMessage('Please provide your response before advancing to the next question.');
      return;
    }

    // Stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    stopSpeakingAI();

    setSubmittingTurn(true);
    setErrorMessage('');

    try {
      const res = await api.respondCommunicationAssessment({
        attemptId: activeAttempt._id,
        studentResponse: studentInput.trim(),
        durationSeconds: turnSeconds
      });

      if (res.success) {
        if (res.isCompleted) {
          // Reached all turns -> trigger evaluation
          setDialogue(res.dialogue || []);
          handleFinalEvaluation(activeAttempt._id);
        } else {
          // Advance to next turn
          setDialogue(res.dialogue || []);
          setCurrentTurnNumber(res.currentTurnNumber);
          setCurrentQuestion(res.nextTurn?.question || '');
          setStudentInput('');
          setTurnSeconds(0);

          if (voiceAudioEnabled && res.nextTurn?.question) {
            setTimeout(() => speakText(res.nextTurn.question), 400);
          }
        }
      } else {
        setErrorMessage(res.message || 'Failed to record response');
      }
    } catch (err) {
      console.error('Error submitting response:', err);
      setErrorMessage(err.message || 'An error occurred while submitting your answer');
    } finally {
      setSubmittingTurn(false);
    }
  };

  // Final Evaluation
  const handleFinalEvaluation = async (attemptId) => {
    setStep('evaluating');
    setEvaluating(true);
    stopSpeakingAI();

    try {
      const res = await api.evaluateCommunicationAssessment({ attemptId });
      if (res.success && res.attempt) {
        setEvaluationResult(res.attempt);
        setStep('result');
        fetchHistory(); // Refresh history with new attempt
      } else {
        setErrorMessage(res.message || 'Failed to complete evaluation');
        setStep('conversation');
      }
    } catch (err) {
      console.error('Evaluation error:', err);
      setErrorMessage(err.message || 'Network error evaluating attempt');
      setStep('conversation');
    } finally {
      setEvaluating(false);
    }
  };

  // Reset to landing
  const handleReset = () => {
    stopSpeakingAI();
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    setStep('landing');
    setActiveAttempt(null);
    setDialogue([]);
    setEvaluationResult(null);
    setStudentInput('');
    setErrorMessage('');
  };

  // RENDER: Landing Hub (Step 1)
  const renderLanding = () => {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Powered Real-Time Dialogue</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              AI Communication Assessment
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Practice and evaluate your real-world communication skills through AI-powered conversations and receive personalized feedback.
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                variant="primary"
                icon={Play}
                onClick={() => setStep('wizard')}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30"
              >
                Start Assessment
              </Button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="px-5 py-3 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition"
              >
                Previous Attempts ({historyStats.totalAttempts})
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Assessments Done</span>
              <span className="text-2xl font-black text-slate-900">{historyStats.totalAttempts}</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Average Score</span>
              <span className="text-2xl font-black text-indigo-600">{historyStats.averageScore || '—'}<span className="text-sm font-bold text-slate-400">/100</span></span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Highest Score</span>
              <span className="text-2xl font-black text-emerald-600">{historyStats.bestScore || '—'}<span className="text-sm font-bold text-slate-400">/100</span></span>
            </div>
          </div>
        </div>

        {/* Assessment Category Capabilities */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Communication Simulation Tracks</h3>
              <p className="text-xs text-slate-500">Choose from 6 specialized industry & campus evaluation formats</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ASSESSMENT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type.id);
                    setStep('wizard');
                  }}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center border transition-transform group-hover:scale-105`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                      {type.title}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {type.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                    <span>Practice Simulation</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Previous Attempts Preview Table */}
        {pastAttempts.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Recent Communication Attempts</h3>
                <p className="text-xs text-slate-500">Review your past dialogues, score breakdowns, and recommendations</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>View Full History</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Assessment Type</th>
                    <th className="pb-3">Difficulty</th>
                    <th className="pb-3">Mode</th>
                    <th className="pb-3">Score</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {pastAttempts.slice(0, 5).map((att) => (
                    <tr key={att._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 font-bold text-slate-900">{att.assessmentType}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          att.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          att.difficulty === 'Hard' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {att.difficulty}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500">{att.responseMode}</td>
                      <td className="py-3.5">
                        <span className="font-black text-sm text-blue-600">
                          {att.evaluation?.overallScore || 0}/100
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500">
                        {new Date(att.completedAt || att.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right">
                        <Button
                          size="xs"
                          variant="outline"
                          icon={Eye}
                          onClick={() => setSelectedPastAttempt(att)}
                        >
                          View Report
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // RENDER: Wizard Configuration (Steps 2, 3, 4)
  const renderWizard = () => {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Configure Communication Assessment</h2>
            <p className="text-xs text-slate-500 mt-1">Select your simulation parameters before starting the AI session</p>
          </div>
          <button
            type="button"
            onClick={() => setStep('landing')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step 2 — Select Assessment Type */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">1</span>
            <h3 className="text-base font-black text-slate-900">Select Assessment Type</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {ASSESSMENT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              return (
                <div
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs ${isSelected ? 'text-blue-600' : 'text-slate-600'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {isSelected && <CheckCircle className="w-4 h-4 text-blue-600" />}
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{type.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{type.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3 — Select Difficulty */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">2</span>
            <h3 className="text-base font-black text-slate-900">Select Difficulty Level</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {DIFFICULTIES.map((diff) => {
              const isSelected = selectedDifficulty === diff.id;
              return (
                <div
                  key={diff.id}
                  onClick={() => setSelectedDifficulty(diff.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${diff.badgeColor}`}>
                      {diff.label}
                    </span>
                    {isSelected && <CheckCircle className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{diff.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 4 — Select Response Mode */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">3</span>
            <h3 className="text-base font-black text-slate-900">Select Response Mode</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Voice Mode */}
            <div
              onClick={() => setSelectedMode('Voice Mode')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                selectedMode === 'Voice Mode'
                  ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Mic className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">Voice Mode</h4>
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-1.5 py-0.2 rounded">Recommended</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Speak your answers aloud into your microphone with real-time AI speech-to-text transcription.
                </p>
              </div>
            </div>

            {/* Text Mode */}
            <div
              onClick={() => setSelectedMode('Text Mode')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                selectedMode === 'Text Mode'
                  ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Text Mode</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Type your responses directly in a clean markdown text editor if microphone is unavailable.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 — Select Number of Questions */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">4</span>
              <h3 className="text-base font-black text-slate-900">Number of Questions</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-xl">
                Estimated Time: ~{Math.max(3, Math.round((isCustomCount ? (parseInt(customQuestionCount, 10) || 3) : selectedQuestionCount) * 1.6))} minutes
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            {QUESTION_COUNT_PRESETS.map((preset) => {
              const isSelected = !isCustomCount && selectedQuestionCount === preset.count;
              return (
                <div
                  key={preset.count}
                  onClick={() => {
                    setIsCustomCount(false);
                    setSelectedQuestionCount(preset.count);
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-center flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="text-lg font-black text-slate-900">{preset.count}</div>
                  <div className="text-[11px] font-bold text-slate-600">{preset.label}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{preset.time}</div>
                </div>
              );
            })}

            {/* Custom Option */}
            <div
              onClick={() => {
                setIsCustomCount(true);
                if (!customQuestionCount) setCustomQuestionCount('8');
              }}
              className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-center flex flex-col justify-between ${
                isCustomCount
                  ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="text-lg font-black text-slate-900">Custom</div>
              <div className="text-[11px] font-bold text-slate-600">Enter count</div>
              <div className="text-[10px] text-slate-400 mt-1">1–25 Qs</div>
            </div>
          </div>

          {/* Custom Input Field */}
          {isCustomCount && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div>
                <span className="font-bold text-xs text-slate-900 block">Enter Custom Question Count (1 to 25):</span>
                <span className="text-[11px] text-slate-500">The AI conversation will dynamically continue for the exact number of questions you select.</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={customQuestionCount}
                  onChange={(e) => setCustomQuestionCount(e.target.value)}
                  placeholder="e.g. 8"
                  className="w-24 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-xs font-bold text-slate-600">Questions</span>
              </div>
            </div>
          )}
        </div>

        {/* Submit & Launch */}
        <div className="flex items-center justify-between pt-4">
          <Button
            size="md"
            variant="outline"
            onClick={() => setStep('landing')}
          >
            Back
          </Button>

          <Button
            size="lg"
            variant="primary"
            icon={Play}
            disabled={submittingTurn}
            onClick={handleStartAssessmentSession}
            className="bg-blue-600 hover:bg-blue-500 font-bold px-8 shadow-md shadow-blue-600/30"
          >
            {submittingTurn ? 'Initializing AI Session...' : 'Begin AI Assessment →'}
          </Button>
        </div>
      </div>
    );
  };

  // RENDER: Step 5 — Interactive AI Conversation
  const renderConversation = () => {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Top Control Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black border border-indigo-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-slate-900">{selectedType}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedDifficulty}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {targetTurns} Questions
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Persona: <strong className="text-slate-800">{scenarioRole}</strong></p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => {
                setVoiceAudioEnabled(!voiceAudioEnabled);
                if (voiceAudioEnabled) stopSpeakingAI();
              }}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                voiceAudioEnabled
                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
              }`}
              title={voiceAudioEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
            >
              {voiceAudioEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{voiceAudioEnabled ? 'AI Voice On' : 'AI Voice Off'}</span>
            </button>

            {/* Turn Counter Pill */}
            <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>Question {currentTurnNumber} of {targetTurns}</span>
            </div>

            {/* Elapsed Timer */}
            <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>{Math.floor(turnSeconds / 60)}:{(turnSeconds % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        {/* Scenario Context Alert */}
        {scenarioContext && (
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-indigo-950">
            <Lightbulb className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
            <div>
              <span className="font-bold block uppercase tracking-wider text-[10px] text-indigo-600 mb-0.5">Simulation Context</span>
              <p className="leading-relaxed">{scenarioContext}</p>
            </div>
          </div>
        )}

        {/* Conversation Dialogue Stream */}
        <div className="space-y-4">
          {/* Past turns */}
          {dialogue.map((turn, idx) => {
            if (idx === dialogue.length - 1 && !turn.studentResponse) return null; // Current active turn shown separately
            return (
              <div key={idx} className="space-y-3">
                {/* AI Question */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                    AI
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-xs p-4 border border-slate-200 shadow-2xs max-w-2xl text-xs text-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">{turn.scenarioRole || 'Interviewer'}</span>
                    <p className="font-medium leading-relaxed">{turn.question}</p>
                  </div>
                </div>

                {/* Student Response */}
                {turn.studentResponse && (
                  <div className="flex items-start justify-end gap-3">
                    <div className="bg-blue-600 text-white rounded-2xl rounded-tr-xs p-4 shadow-sm max-w-2xl text-xs space-y-1 text-right">
                      <span className="text-[10px] font-bold text-blue-200 block uppercase">You</span>
                      <p className="font-medium leading-relaxed text-left">{turn.studentResponse}</p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                      Me
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Current Active Question Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-blue-500/40 shadow-lg space-y-6 relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    Question {currentTurnNumber} of {targetTurns} • {scenarioRole}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                    {currentQuestion}
                  </h3>
                </div>
              </div>

              {/* Re-read AI prompt */}
              <button
                type="button"
                onClick={() => speakText(currentQuestion)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition shrink-0"
                title="Hear Question Again"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Response Input Area */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  Your Response {selectedMode === 'Voice Mode' ? '(Speak or Type)' : '(Type below)'}
                </span>
                <span className="text-slate-400 font-medium">
                  {studentInput.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              <textarea
                rows={5}
                value={studentInput}
                onChange={(e) => setStudentInput(e.target.value)}
                placeholder={
                  selectedMode === 'Voice Mode'
                    ? 'Click the microphone button to speak, or type your structured response directly here...'
                    : 'Type your detailed response here. Use clear examples and structure (e.g. Situation, Task, Action, Result)...'
                }
                className="w-full rounded-2xl border border-slate-300 p-4 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none custom-scrollbar"
              />

              {/* Mic & Voice Controls */}
              {selectedMode === 'Voice Mode' && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                        isListening
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 animate-pulse'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                      }`}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      <span>{isListening ? 'Stop Speaking' : 'Start Speaking (Mic)'}</span>
                    </button>

                    {isListening && (
                      <div className="flex items-center gap-1 text-xs text-rose-600 font-bold animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-rose-600" />
                        <span>Listening... Speak naturally</span>
                      </div>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-500">
                    Transcribing automatically with Web Speech STT
                  </span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
              >
                Exit Assessment
              </Button>

              <Button
                size="md"
                variant="primary"
                icon={Send}
                disabled={submittingTurn || !studentInput.trim()}
                onClick={handleSubmitTurnResponse}
                className="bg-blue-600 hover:bg-blue-500 font-bold shadow-md shadow-blue-600/30"
              >
                {submittingTurn
                  ? 'Processing AI Follow-Up...'
                  : currentTurnNumber >= targetTurns
                  ? `Submit & Complete Assessment (${currentTurnNumber}/${targetTurns}) →`
                  : `Submit & Continue (${currentTurnNumber}/${targetTurns}) →`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // RENDER: Evaluating Transition State
  const renderEvaluating = () => {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto text-blue-600 border border-blue-200 animate-pulse shadow-sm">
          <Sparkles className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-900">Evaluating Your Communication</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            MITRA AI is analyzing your grammar, fluency, vocabulary, relevance, clarity, answer structure, and confidence indicators...
          </p>
        </div>
        <div className="flex justify-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  };

  // RENDER: Step 6 & 7 — AI Evaluation & AI Feedback Result
  const renderResult = () => {
    if (!evaluationResult) return null;
    const ev = evaluationResult.evaluation || {};
    const overall = ev.overallScore || 0;

    const rubrics = [
      { key: 'grammar', label: 'Grammar', score: ev.grammar || 0, desc: 'Syntactic accuracy & sentence construction' },
      { key: 'fluency', label: 'Fluency', score: ev.fluency || 0, desc: 'Smooth transition of thoughts & coherence' },
      { key: 'vocabulary', label: 'Vocabulary', score: ev.vocabulary || 0, desc: 'Domain terminology & word precision' },
      { key: 'relevance', label: 'Relevance', score: ev.relevance || 0, desc: 'Direct alignment to scenario prompts' },
      { key: 'structure', label: 'Answer Structure', score: ev.structure || 0, desc: 'STAR format & narrative organization' },
      { key: 'clarity', label: 'Clarity', score: ev.clarity || 0, desc: 'Conciseness & ease of comprehension' },
      { key: 'confidenceIndicator', label: 'Confidence Indicator', score: ev.confidenceIndicator || 0, desc: 'AI communication conviction indicator' }
    ];

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold border border-blue-400/30">
                <Award className="w-3.5 h-3.5" />
                <span>Assessment Completed Successfully</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {evaluationResult.assessmentType} Performance Report
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                  Difficulty: {evaluationResult.difficulty}
                </span>
                <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                  Questions: {evaluationResult.questionCount || evaluationResult.targetTurns || evaluationResult.dialogue?.length || 3} Questions
                </span>
                <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                  Mode: {evaluationResult.responseMode}
                </span>
                <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                  {new Date(evaluationResult.completedAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Circular Overall Score Badge */}
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-center flex flex-col items-center justify-center shrink-0 min-w-[160px]">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-300 block">Overall Score</span>
              <div className="text-4xl sm:text-5xl font-black text-white mt-1">
                {overall}
                <span className="text-lg font-bold text-slate-400">/100</span>
              </div>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded mt-2 ${
                overall >= 75 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                overall >= 60 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {overall >= 75 ? 'Placement Ready' : overall >= 60 ? 'Developing' : 'Needs Practice'}
              </span>
            </div>
          </div>
        </div>

        {/* 7-Rubric Metric Breakdown Grid */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Communication Competency Breakdown</h3>
              <p className="text-xs text-slate-500">Evaluated across standard corporate and campus recruitment rubrics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rubrics.map((r) => (
              <div key={r.key} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{r.label}</span>
                  <span className="font-black text-sm text-blue-600">{r.score}/100</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      r.score >= 80 ? 'bg-emerald-500' : r.score >= 65 ? 'bg-blue-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${r.score}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step 7 — Strengths & Areas to Improve */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-black text-base">Key Strengths</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700">
              {(ev.strengths || []).map((st, i) => (
                <li key={i} className="flex items-start gap-2 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span className="leading-relaxed">{st}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas to Improve */}
          <div className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-amber-800">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <h3 className="font-black text-base">Areas to Improve</h3>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700">
              {(ev.improvements || []).map((imp, i) => (
                <li key={i} className="flex items-start gap-2 bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                  <span className="text-amber-600 font-bold">→</span>
                  <span className="leading-relaxed">{imp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* AI Recommendations & Strategy Box */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-3xl p-6 sm:p-8 border border-blue-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-blue-900">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <h3 className="font-black text-base">AI Personalized Recommendations</h3>
          </div>
          <div className="space-y-2.5 text-xs text-slate-700">
            {(ev.recommendations || []).map((rec, i) => (
              <div key={i} className="bg-white p-3.5 rounded-2xl border border-blue-100 flex items-start gap-3 shadow-2xs">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="leading-relaxed text-slate-800">{rec}</p>
              </div>
            ))}
          </div>

          {ev.detailedFeedback && (
            <div className="pt-3 border-t border-blue-100 text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-800 block mb-1">Evaluator Synthesis:</strong>
              <p>{ev.detailedFeedback}</p>
            </div>
          )}
        </div>

        {/* Full Transcript Inspection Accordion */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-black text-base text-slate-900">Complete Simulation Transcript</h3>
          <div className="space-y-4 text-xs">
            {(evaluationResult.dialogue || []).map((t, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between text-slate-400 font-bold text-[10px] uppercase">
                  <span>Turn {idx + 1} • {t.scenarioRole || 'Interviewer'}</span>
                </div>
                <p className="font-semibold text-slate-900">{t.question}</p>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-700 mt-2">
                  <span className="text-[10px] font-bold text-blue-600 block uppercase mb-1">Your Response:</span>
                  <p className="leading-relaxed">{t.studentResponse || '(No response recorded)'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <Button
            size="md"
            variant="outline"
            icon={RotateCcw}
            onClick={() => {
              setStep('wizard');
              setEvaluationResult(null);
            }}
          >
            Practice Another Simulation
          </Button>

          <Button
            size="md"
            variant="primary"
            onClick={handleReset}
            className="bg-blue-600 hover:bg-blue-500 font-bold"
          >
            Return to Communication Hub
          </Button>
        </div>
      </div>
    );
  };

  // RENDER: Step 8 — Previous Attempts & History View
  const renderHistory = () => {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900">Communication Assessment History</h3>
            <p className="text-xs text-slate-500">Track your oral communication progress and view detailed past evaluation transcripts</p>
          </div>
          <Button
            size="sm"
            variant="primary"
            icon={Play}
            onClick={() => {
              setActiveTab('assessment');
              setStep('wizard');
            }}
          >
            Start New Assessment
          </Button>
        </div>

        {/* Progress Progression Chart (Attempt 1 -> Attempt 4) */}
        {historyStats.trajectory && historyStats.trajectory.length > 0 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Communication Progress Trend</h4>
              <p className="text-xs text-slate-500">Score improvement across assessment attempts</p>
            </div>

            <div className="space-y-3">
              {historyStats.trajectory.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Attempt {item.attemptNumber}: {item.assessmentType} ({item.difficulty})</span>
                    <span className="text-blue-600 font-black">{item.score}/100</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(10, item.score)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Attempts Table */}
        {historyLoading ? (
          <LoadingState message="Fetching past communication attempts..." />
        ) : pastAttempts.length > 0 ? (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Attempt</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Difficulty</th>
                    <th className="pb-3">Questions</th>
                    <th className="pb-3">Mode</th>
                    <th className="pb-3">Overall Score</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {pastAttempts.map((att, idx) => (
                    <tr key={att._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 font-bold text-slate-400">#{pastAttempts.length - idx}</td>
                      <td className="py-3.5 font-bold text-slate-900">{att.assessmentType}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          att.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          att.difficulty === 'Hard' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {att.difficulty}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-600 font-bold">
                        {att.questionCount || att.targetTurns || att.dialogue?.length || 3} Qs
                      </td>
                      <td className="py-3.5 text-slate-500">{att.responseMode}</td>
                      <td className="py-3.5 font-black text-sm text-blue-600">
                        {att.evaluation?.overallScore || 0}/100
                      </td>
                      <td className="py-3.5 text-slate-500">
                        {new Date(att.completedAt || att.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right">
                        <Button
                          size="xs"
                          variant="outline"
                          icon={Eye}
                          onClick={() => setSelectedPastAttempt(att)}
                        >
                          View Report
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No Communication Assessments Yet"
            description="You haven't completed any AI communication simulations yet. Start your first session to build your employability readiness."
          />
        )}

        {/* Modal for Past Attempt Details */}
        {selectedPastAttempt && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedPastAttempt.assessmentType} Report</h3>
                  <p className="text-xs text-slate-500">
                    {selectedPastAttempt.difficulty} Level • {selectedPastAttempt.questionCount || selectedPastAttempt.targetTurns || selectedPastAttempt.dialogue?.length || 3} Questions • {new Date(selectedPastAttempt.completedAt || selectedPastAttempt.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPastAttempt(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Overall Score Badge */}
              <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Overall Communication Score</span>
                  <div className="text-3xl font-black text-blue-600 mt-0.5">
                    {selectedPastAttempt.evaluation?.overallScore || 0}/100
                  </div>
                </div>
                <Badge variant="primary">{selectedPastAttempt.responseMode}</Badge>
              </div>

              {/* Category Scores */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {[
                  { label: 'Grammar', val: selectedPastAttempt.evaluation?.grammar },
                  { label: 'Fluency', val: selectedPastAttempt.evaluation?.fluency },
                  { label: 'Vocabulary', val: selectedPastAttempt.evaluation?.vocabulary },
                  { label: 'Relevance', val: selectedPastAttempt.evaluation?.relevance },
                  { label: 'Answer Structure', val: selectedPastAttempt.evaluation?.structure },
                  { label: 'Clarity', val: selectedPastAttempt.evaluation?.clarity }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-center">
                    <span className="text-slate-500 block text-[11px]">{item.label}</span>
                    <span className="text-base font-black text-slate-900">{item.val || 0}</span>
                  </div>
                ))}
              </div>

              {/* Transcript */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Simulation Transcript</h4>
                {(selectedPastAttempt.dialogue || []).map((t, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <span className="font-bold text-[10px] text-slate-400 block uppercase">Turn {idx + 1} • {t.scenarioRole || 'Interviewer'}</span>
                    <p className="font-semibold text-slate-900">{t.question}</p>
                    <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80">{t.studentResponse || '(No response)'}</p>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              {selectedPastAttempt.evaluation?.recommendations?.length > 0 && (
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs space-y-2 text-indigo-950">
                  <span className="font-bold block uppercase text-[10px] text-indigo-600">AI Recommendations</span>
                  <ul className="list-disc pl-4 space-y-1">
                    {selectedPastAttempt.evaluation.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button size="sm" variant="primary" onClick={() => setSelectedPastAttempt(null)}>
                  Close Report
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Subnavigation Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('assessment');
            if (step === 'result') setStep('landing');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'assessment'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Simulation</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Previous Attempts & History</span>
        </button>
      </div>

      {/* Main Container Based on State */}
      {activeTab === 'history' ? (
        renderHistory()
      ) : (
        <>
          {step === 'landing' && renderLanding()}
          {step === 'wizard' && renderWizard()}
          {step === 'conversation' && renderConversation()}
          {step === 'evaluating' && renderEvaluating()}
          {step === 'result' && renderResult()}
        </>
      )}
    </div>
  );
};

export default AICommunicationAssessmentView;
