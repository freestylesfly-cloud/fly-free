import type { CannyConfig } from './CannyAssistant';

/**
 * Canny's personality and job on flyfree.co.in. Everything Fly-Free-specific
 * lives here; CannyAssistant itself is generic.
 *
 * Tips point at elements marked `data-canny="…"` in the pages, so moving a
 * button never breaks a tip — only removing the attribute does.
 */
export const FLYFREE_CANNY: CannyConfig = {
  name: 'Canny',
  storageKey: 'flyfree_canny',
  defaultOutfit: { color: '#121212', label: 'FLY FREE', textColor: '#ffffff' },
  hoverTarget: '[data-canny="product-card"]',
  // Clear of the mobile tab bar, and of the chat button on the right.
  bottomOffset: { mobile: 92, desktop: 18 },
  rightReserve: { mobile: 76, desktop: 110 },
  askLabel: '💬 Ask me anything',
  tips: [
    {
      id: 'add-to-cart',
      path: /^\/products\/[^/]+$/,
      target: '[data-canny="add-to-cart"]',
      text: 'Pick your size, then tap here to add it to your cart! 🛒'
    },
    {
      id: 'checkout',
      path: /^\/cart$/,
      target: '[data-canny="checkout"]',
      text: 'All set? Checkout is right here. ✨'
    },
    {
      id: 'voucher',
      path: /^\/checkout$/,
      target: '[data-canny="coupon"]',
      text: 'Got a coupon or a prize voucher? Pop it in here! 🎁'
    }
  ],
  lines: {
    greeting: [
      "Hi! I'm Canny 🐦 Fly Free's little helper. Tap me anytime!",
      "Hey there! I'm Canny. Need a hand finding the perfect tee? Tap me!"
    ],
    welcomeBack: ['Welcome back! I missed you 💛', 'Oh hey, you\'re back! New drops are waiting 👀', 'Yay, it\'s you again! 🎉'],
    hi: ['Hi hi! 👋', 'Hello friend! 🐦', 'Hey! Looking good today 😎', 'Chirp chirp! That means hi.'],
    idle: [
      'Psst… new drops just landed! 👀',
      'Fun fact: I never fly without a good tee.',
      'Drag me anywhere — I don\'t bite! 🐣',
      'Tap me if you want to play a game 🎮',
      'Our tees are printed with love (and a little birdseed).',
      'Free delivery on bigger orders — just saying 😉'
    ],
    wake: ["Huh? Oh! I wasn't sleeping… 😳", "I'm up, I'm up! 🐦", 'Zz— oh, hi! 👋'],
    drop: ['Whee! Nice throw 😵', 'New spot, I like it!', 'Wooo — that was fun!', "Okay, I'll hang out here."],
    tickle: ['Hehe, that tickles! 😆', 'Stop it, I\'m ticklish! 🤭', 'Okay okay, I\'m awake! 😂'],
    scrollFast: ['Wheee! Slow down, there\'s good stuff here! 🌀', 'Whoa, you scroll faster than I fly! 💨'],
    pageEnd: ['You made it to the end! 🎉 Want to see the new drops?', 'That\'s everything here — tap a theme up top to see more!'],
    hover: ['Ooh, that one would look great on you! 😍', 'Good taste! Tap it to see the sizes 👀', 'That one\'s a fan favourite! 🔥'],
    newOutfit: ['New tee! How do I look in {label}? 😎', 'Changed into my {label} tee — fits like a dream! ✨'],
    followStart: ['Lead the way! 🐾', "I'm right behind you!"],
    followEnd: ['That was fun! I\'ll wait here 😊', 'Phew, my wings need a rest!'],
    nap: ['Just a quick nap… 😴', 'Wake me if you find something cool!'],
    gameStart: ['Catch the falling tees! Tap as many as you can! 👕', 'Ready? Catch those tees! 🎮'],
    gameEnd: ['You caught {score} tees! 🎉 Best: {best}', '{score} tees! Your best is {best}. Again? 😄'],
    hide: ['Okay, I\'ll hide. Tap the little bird to bring me back! 🙈']
  }
};
