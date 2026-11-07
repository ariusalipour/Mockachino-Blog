import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeQuiz } from '../src/lib/quiz-grading.mjs';

const questions = [
  { answers: [{ text: 'A', correct: true }, { text: 'B', correct: false }], explanation: 'A is right.' },
  { answers: [{ text: 'C', correct: false }, { text: 'D', correct: true }, { text: 'E', correct: false }], explanation: 'D is right.' },
  { answers: [{ text: 'F', correct: false }, { text: 'G', correct: true }], explanation: 'G is right.' },
];

test('grades mixed quiz answers and returns per-question feedback', () => {
  assert.deepEqual(gradeQuiz(questions, [0, 0, 1]), {
    correct: 2, total: 3, percentage: 67,
    answers: [
      { correct: true, correctIndex: 0, explanation: 'A is right.' },
      { correct: false, correctIndex: 1, explanation: 'D is right.' },
      { correct: true, correctIndex: 1, explanation: 'G is right.' },
    ],
  });
});

test('rejects unanswered quizzes and malformed selection keys', () => {
  assert.throws(() => gradeQuiz(questions, [0, 1]), /Answer every question/);
  assert.throws(() => gradeQuiz(questions, [0, 1, -1]), /Choose one answer/);
  assert.throws(() => gradeQuiz(questions, [0, 1, 2]), /Choose one answer/);
  assert.throws(() => gradeQuiz(questions, [0, 1, 1.5]), /Choose one answer/);
});

test('rejects quiz questions with missing or multiple correct answers', () => {
  const noCorrect = structuredClone(questions);
  noCorrect[0].answers.forEach(answer => { answer.correct = false; });
  assert.throws(() => gradeQuiz(noCorrect, [0, 1, 1]), /exactly one correct answer/);
  const multipleCorrect = structuredClone(questions);
  multipleCorrect[0].answers[1].correct = true;
  assert.throws(() => gradeQuiz(multipleCorrect, [0, 1, 1]), /exactly one correct answer/);
});
