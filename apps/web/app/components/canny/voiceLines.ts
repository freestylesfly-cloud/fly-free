/**
 * Every fixed sentence Canny can say out loud, beyond the lines in flyfree.ts.
 *
 * These are pre-recorded in a cute female voice by
 * scripts/generate-canny-voice.mts (Kokoro, open source, Apache-2.0) into
 * public/canny-voice/. Change a sentence here or in flyfree.ts and re-run the
 * script, otherwise that sentence plays as bird chirps instead.
 */

/** The style chat's fixed answers (StyleAssistant). */
export const CHAT_LINES = {
  welcome: 'Hi, I am Canny, your Fly Free style buddy. Tell me what you want to wear and I will find a few options.',
  welcomeBack: 'Welcome back! Want something similar to what you viewed, or are you shopping for a different mood?',
  newPicks: 'Here are the newest Fly Free picks.',
  newFallback: 'I do not see a new-drop flag yet, but these are the strongest current picks.',
  sizeHelp: 'For the best fit, open the product you like and check its size guide before adding it to your cart. If you are between sizes, choose the larger size for a relaxed fit.',
  supportHelp: 'I can help with products here. For order status, delivery, or returns, open Help and FAQs and we will take you to the right support details.',
  found: 'I found a few options that fit that search. I have highlighted them below.',
  askMore: 'Tell me a theme, fit, colour, or mood, like oversized black, anime, racing, or something relaxed.',
  noMic: 'Voice input is not available in this browser. You can type your request below.'
} as const;

/**
 * What to say out loud for lines whose on-screen text has a blank in it, like
 * "{label}" or "{score}" — the recording can't know the theme or the score.
 */
export const SPOKEN_OVERRIDES: Record<string, string> = {
  'New tee! How do I look in {label}? 😎': 'New tee! How do I look?',
  'Changed into my {label} tee — fits like a dream! ✨': 'Changed into my new tee. It fits like a dream!',
  'You caught {score} tees! 🎉 Best: {best}': 'Yay! Great catching!',
  '{score} tees! Your best is {best}. Again? 😄': 'Wow, nice catching! Want to play again?'
};
