import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../contexts/AuthContext.jsx'
import { useProgress } from '../hooks/useProgress.js'
import { trails } from '../data/trails.js'
import { getLessonById } from '../data/lessons/index.js'
import { getArchetype } from '../utils/archetypes.js'
import { analyzeLearningProfile } from '../services/aiService.js'
import { saveFullLearningProfile } from '../services/learningProfileService.js'
import { updateUserProfile } from '../services/userService.js'

import { AssessmentIntroScreen } from '../components/assessment/AssessmentIntroScreen.jsx'
import { AssessmentFlow } from '../components/assessment/AssessmentFlow.jsx'
import { AssessmentAnalyzingScreen } from '../components/assessment/AssessmentAnalyzingScreen.jsx'
import { AssessmentResultScreen } from '../components/assessment/AssessmentResultScreen.jsx'
import { toUserMessage } from '../utils/errors.js'

export default function AssessmentPage() {
  const { user } = useAuthContext()
  const { profile } = useProgress()
  const navigate = useNavigate()

  const [stage, setStage] = useState('intro') // 'intro' | 'flow' | 'analyzing' | 'result'
  const [assessmentAnswers, setAssessmentAnswers] = useState(null)
  const [calculatedArchetype, setCalculatedArchetype] = useState(null)
  const [roadmapResult, setRoadmapResult] = useState(null)
  const [backendDone, setBackendDone] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const handleStartFlow = () => {
    setStage('flow')
  }

  const handleFlowComplete = async (answers) => {
    setAssessmentAnswers(answers)
    setStage('analyzing')
    setBackendDone(false)
    setSaveError(null)

    const archetype = getArchetype(answers.experience, answers.objective)
    setCalculatedArchetype(archetype)

    // Determine source (signup vs retroactive) based on xp and completedLessons
    const isNewUser = profile?.xp === 0 && (profile?.completedLessons || []).length === 0
    const source = isNewUser ? 'signup' : 'retroactive'

    try {
      const generatedRoadmap = await analyzeLearningProfile({
        assessment: answers,
        archetype,
        availableTrails: trails,
      })

      setRoadmapResult(generatedRoadmap)

      if (!user?.id) throw new Error('Sessão de utilizador não encontrada.')

      await saveFullLearningProfile(user.id, {
        assessment: answers,
        roadmap: generatedRoadmap,
        source,
      })
      setBackendDone(true)
    } catch (err) {
      console.error('[AssessmentPage] Error analyzing or saving profile:', err)
      setSaveError(
        toUserMessage(
          err,
          'Não foi possível concluir e guardar o seu plano. Verifique a ligação e tente novamente.',
        ),
      )
    }
  }

  const handleAnalyzingFinish = useCallback(() => {
    setStage('result')
  }, [])

  const handleStartJourney = async () => {
    if (user?.id) {
      try {
        await updateUserProfile(user.id, { firstStepsDone: true })
      } catch (err) {
        console.error('[AssessmentPage] Error updating firstStepsDone:', err)
      }
    }

    const firstStep = roadmapResult?.firstStep
    if (firstStep?.lessonId) {
      const lesson = getLessonById(firstStep.lessonId)
      if (lesson?.type === 'videoLesson') {
        navigate(`/video-aula/${firstStep.lessonId}`)
      } else {
        navigate(`/aula/${firstStep.lessonId}`)
      }
    } else if (firstStep?.courseId) {
      navigate(`/trilhas/${firstStep.courseId}`)
    } else {
      navigate('/trilhas')
    }
  }

  if (stage === 'intro') {
    return <AssessmentIntroScreen onStart={handleStartFlow} />
  }

  if (stage === 'flow') {
    return <AssessmentFlow onComplete={handleFlowComplete} />
  }

  if (stage === 'analyzing') {
    return (
      <AssessmentAnalyzingScreen
        isBackendDone={backendDone}
        error={saveError}
        onRetry={() => assessmentAnswers && handleFlowComplete(assessmentAnswers)}
        onFinish={handleAnalyzingFinish}
      />
    )
  }

  if (stage === 'result') {
    return (
      <AssessmentResultScreen
        archetype={calculatedArchetype || 'Explorador Curioso'}
        roadmap={roadmapResult}
        onStartJourney={handleStartJourney}
      />
    )
  }

  return null
}
