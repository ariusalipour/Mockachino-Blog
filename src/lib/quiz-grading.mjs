/**
 * Grade a public, single-choice self-check. Answer keys are intentionally part
 * of the static page; this is practice feedback rather than secure assessment.
 * @param {{answers: {text: string, correct: boolean}[], explanation: string}[]} questions
 * @param {number[]} selections
 */
export function gradeQuiz(questions, selections) {
  if (!questions.length || selections.length !== questions.length) throw new RangeError('Answer every question before checking your score.');
  const answers = questions.map((question, index) => {
    const correctAnswers = question.answers.flatMap((answer, answerIndex) => answer.correct ? [answerIndex] : []);
    if (correctAnswers.length !== 1) throw new RangeError('Each question must have exactly one correct answer.');
    const selected = selections[index];
    if (!Number.isInteger(selected) || selected < 0 || selected >= question.answers.length) throw new RangeError('Choose one answer for every question.');
    return { correct: selected === correctAnswers[0], correctIndex: correctAnswers[0], explanation: question.explanation };
  });
  const correct = answers.filter(answer => answer.correct).length;
  return { correct, total: questions.length, percentage: Math.round(correct / questions.length * 100), answers };
}
