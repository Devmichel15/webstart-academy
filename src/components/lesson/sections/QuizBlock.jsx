import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'

export function QuizBlock({ quiz, onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState([])
  const [finished, setFinished] = useState(false)

  if (!quiz || !quiz.questions || !quiz.questions.length) return null

  const question = quiz.questions[currentQuestion]
  const isCorrect = selectedAnswer === question.correctIndex
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100

  const handleAnswer = (index) => {
    if (showResult) return
    setSelectedAnswer(index)
  }

  const handleConfirm = () => {
    if (selectedAnswer === null) return
    const correct = selectedAnswer === question.correctIndex
    setShowResult(true)
    if (correct) setScore((s) => s + 1)
    setAnswers((prev) => [...prev, { questionIndex: currentQuestion, correct }])
  }

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((q) => q + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setFinished(true)
    }
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setAnswers([])
    setFinished(false)
  }

  if (finished) {
    const percentage = Math.round((score / quiz.questions.length) * 100)
    if (onComplete) onComplete(score, quiz.questions.length)
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <Card className="text-center">
          <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 ${percentage >= 70 ? 'border-green-500 bg-green-50' : 'border-amber-500 bg-amber-50'} dark:bg-opacity-20`}>
            <span className={`text-3xl font-black ${percentage >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
              {percentage}%
            </span>
          </div>
          <h3 className="mb-2 text-xl font-black">
            {percentage >= 80 ? 'Excelente!' : percentage >= 60 ? 'Bom trabalho!' : 'Continue praticando!'}
          </h3>
          <p className="mb-4 text-reading">
            Você acertou {score} de {quiz.questions.length} questões
          </p>
          <div className="mb-4 space-y-2 text-left">
            {quiz.questions.map((q, i) => (
              <div key={i} className={`flex items-start gap-2 rounded-lg p-2 text-sm ${answers[i]?.correct ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200' : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'}`}>
                {answers[i]?.correct ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
                <span>{q.question}</span>
              </div>
            ))}
          </div>
          <Button onClick={handleRestart}>Refazer quiz</Button>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-brand-600">
          Questão {currentQuestion + 1} de {quiz.questions.length}
        </span>
        <span className="text-sm font-bold text-brand-600">
          {score} acertos
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full border-2 border-brand-800 bg-brand-100 dark:bg-brand-900">
        <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <Card key={currentQuestion}>
        <h3 className="mb-4 text-lg font-black">{question.question}</h3>
        <div className="space-y-2">
          {question.options.map((option, index) => {
            let optionStyle = 'border-brand-200 dark:border-brand-700 hover:border-brand-500'
            if (showResult && index === question.correctIndex) {
              optionStyle = 'border-green-500 bg-green-50 dark:bg-green-950'
            } else if (showResult && index === selectedAnswer && index !== question.correctIndex) {
              optionStyle = 'border-red-500 bg-red-50 dark:bg-red-950'
            } else if (selectedAnswer === index && !showResult) {
              optionStyle = 'border-brand-500 bg-brand-50 dark:bg-brand-900'
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showResult}
                className={`flex w-full items-center gap-3 rounded-lg border-3 p-3 text-left text-sm font-semibold transition ${optionStyle}`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-xs font-bold ${
                  showResult && index === question.correctIndex
                    ? 'border-green-500 bg-green-500 text-white'
                    : showResult && index === selectedAnswer && index !== question.correctIndex
                    ? 'border-red-500 bg-red-500 text-white'
                    : selectedAnswer === index && !showResult
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-brand-300 dark:border-brand-600'
                }`}>
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </button>
            )
          })}
        </div>

        {showResult && question.explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`mt-4 rounded-lg border-2 p-3 text-sm ${
              isCorrect
                ? 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200'
                : 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200'
            }`}
          >
            <p className="font-bold">{isCorrect ? 'Correto!' : 'Incorreto'}</p>
            <p className="mt-1">{question.explanation}</p>
          </motion.div>
        )}

        <div className="mt-4 flex justify-between">
          {!showResult ? (
            <Button onClick={handleConfirm} disabled={selectedAnswer === null}>
              Confirmar
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {currentQuestion < quiz.questions.length - 1 ? (
                <>Próxima <ChevronRight size={16} /></>
              ) : (
                'Ver resultado'
              )}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
