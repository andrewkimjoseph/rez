/**
 * Tooltip text constants for form fields across the app.
 * Edit here to change tooltip copy in one place.
 */
export const TOOLTIP_TEXTS = {
  title: 'A clear, descriptive title that explains what users will do. This helps participants understand the task before starting.',
  titleAdmin: 'A clear title that explains what participants will do. Shown in the task list.',

  category: 'Select the category that best matches your task. This helps users find tasks that match their interests.',
  categoryAdmin: 'Category that best matches the task. Used for filtering and discovery.',

  difficulty: 'Estimate how long and complex this task will be for users. Easy (5-10 min), Medium (10-20 min), or Hard (20+ min).',
  difficultyAdmin: 'Easy (5–10 min), Medium (10–20 min), or Hard (20+ min). Helps participants choose tasks.',

  targetCountry: 'Who can see this task. Use ALL for global, or country codes (e.g. KE, NG) comma-separated.',

  link: 'Where participants complete the task (e.g. form URL, app store link, or web app).',
  linkForm: 'The URL where users will access and complete your form or survey (e.g., Google Forms, Typeform, etc.).',
  linkCheckOutApp: 'The URL where users can access your product or app (e.g., App Store, Play Store, or web app link).',
  linkFillAForm: 'Use a Tally form (tally.so). In form settings, enable "Redirect on completion" and set the URL to thepaxtask:// so participants return to the app after submitting.',

  instructions: 'Step-by-step instructions shown to participants before they start the task.',
  instructionsCheckOutApp: 'Provide clear step-by-step instructions on what users should do, look for, or test in your product. Be specific about what you want them to explore or evaluate.',

  feedback: 'Optional URL where participants submit feedback or answers after completing the task.',
  feedbackCheckOutApp: 'The URL of the form where testers will submit their feedback, findings, and answers to your feedback questions after testing your product.',

  paymentTerms: 'When and how participants are paid (e.g. after approval, within 7 days).',

  targetNumberOfParticipants: 'Maximum number of participants (or testers) for this task. Used in cost calculation. Minimum: 50 for surveys, 10 for product testing.',
  participantsSurvey: 'How many people do you want to complete your survey and give you answers? Minimum: 50 participants.',
  participantsProduct: 'How many people do you want to test your product? Minimum: 10 testers.',

  numberOfQuestions: 'For surveys: number of questions. Used in pricing. Minimum: 5 questions.',
  numberOfFeedbackQuestions: 'For product tests: number of feedback questions. One action in the product (e.g. try a feature, complete a flow) equates to one feedback question. Minimum: 3.',
  questionsSurvey: 'How many questions will your survey have? Minimum: 5 questions.',
  questionsProduct: 'How many feedback questions will testers answer about your product? One action in the product (e.g. try a feature, complete a flow) equates to one feedback question. Minimum: 3.',

  rewardAmountPerParticipant: 'Amount paid to each participant when they complete the task (in selected currency).',

  rewardCurrencyId: 'Token or currency used for rewards (e.g. USDC, USDT).',

  managerContractAddress: 'Optional smart contract address for reward distribution. Leave blank if not used.',

  estimatedTimeOfCompletion: 'How long participants typically need to complete this task. Shown in the task card.',

  numberOfCooldownHours: 'Hours until a participant can claim this task again. 0 = no cooldown.',

  reviewStatus: 'Workflow: Pending → Approved → Published (active). Archived = complete and hidden.',

  reasonsForRejection: 'Select the reasons why this task was rejected. These will be shown to the task master.',

  rezTaskMasterEmailAddress: 'Reassign this task to another task master by email.',

  rejectionReasonsHeader: 'Rejection Reasons:',
} as const;
