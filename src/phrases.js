// Organize sayings into sets of 5 for better game management
// Each set can be assigned to a reader, and once used, won't be reused for other readers
export const SAYING_SETS = [
  // Set 1: Ethiopian sayings
  [
    { id: 1, firstHalf: "When spider webs unite", trueEnding: "they can tie up a lion", origin: "Ethiopian saying" },
    { id: 2, firstHalf: "The fool speaks", trueEnding: "the wise man listens", origin: "Ethiopian saying" },
    { id: 3, firstHalf: "A coward sweats", trueEnding: "in water", origin: "Ethiopian saying" },
    { id: 4, firstHalf: "The hyena with a bone", trueEnding: "does not laugh", origin: "Ethiopian saying" },
    { id: 5, firstHalf: "When the heart is at peace", trueEnding: "the body is healthy", origin: "Ethiopian saying" },
  ],
  
  // Set 2: Serbian sayings
  [
    { id: 6, firstHalf: "The wolf changes his coat", trueEnding: "but not his nature", origin: "Serbian saying" },
    { id: 7, firstHalf: "God gives nuts", trueEnding: "to those who have no teeth", origin: "Serbian saying" },
    { id: 8, firstHalf: "The tongue has no bones", trueEnding: "yet it breaks bones", origin: "Serbian saying" },
    { id: 9, firstHalf: "A guest sees more in an hour", trueEnding: "than the host in a year", origin: "Serbian saying" },
    { id: 10, firstHalf: "The mountain never meets another mountain", trueEnding: "but people meet people", origin: "Serbian saying" },
  ],
  
  // Set 3: Bantu sayings
  [
    { id: 11, firstHalf: "The earthworm does not seek out the chicken", trueEnding: "yet it feeds it", origin: "Bantu saying" },
    { id: 12, firstHalf: "When the roots of a tree begin to decay", trueEnding: "it spreads death to the branches", origin: "Bantu saying" },
    { id: 13, firstHalf: "The antelope that has horns", trueEnding: "does not fear the thorn bush", origin: "Bantu saying" },
    { id: 14, firstHalf: "A tree is best measured", trueEnding: "when it is down", origin: "Bantu saying" },
    { id: 15, firstHalf: "The child of a snake", trueEnding: "is also a snake", origin: "Bantu saying" },
  ],

  // Set 4: Finnish sayings
  [
    { id: 16, firstHalf: "The forest answers", trueEnding: "as you call to it", origin: "Finnish saying" },
    { id: 17, firstHalf: "A shared sorrow", trueEnding: "is half a sorrow", origin: "Finnish saying" },
    { id: 18, firstHalf: "The winter teaches you", trueEnding: "what the summer provides", origin: "Finnish saying" },
    { id: 19, firstHalf: "Even the bear", trueEnding: "stumbles on a smooth path", origin: "Finnish saying" },
    { id: 20, firstHalf: "The sauna is the poor man's", trueEnding: "pharmacy", origin: "Finnish saying" },
  ],

  // Set 5: Mongolian sayings
  [
    { id: 21, firstHalf: "A horse with four legs", trueEnding: "still stumbles", origin: "Mongolian saying" },
    { id: 22, firstHalf: "The wolf that lives with sheep", trueEnding: "learns to bleat", origin: "Mongolian saying" },
    { id: 23, firstHalf: "When the small fish swims upstream", trueEnding: "it shows the way for the large", origin: "Mongolian saying" },
    { id: 24, firstHalf: "A yak does not notice", trueEnding: "its own smell", origin: "Mongolian saying" },
    { id: 25, firstHalf: "The camel never sees", trueEnding: "its own hump", origin: "Mongolian saying" },
  ],

  // Set 6: Yoruba sayings (Nigeria)
  [
    { id: 26, firstHalf: "The lizard that jumped from the high tree", trueEnding: "said he would praise himself if no one else did", origin: "Yoruba saying" },
    { id: 27, firstHalf: "It is the fear of what tomorrow may bring", trueEnding: "that makes the tortoise carry his house", origin: "Yoruba saying" },
    { id: 28, firstHalf: "The fly that does not listen", trueEnding: "follows the corpse into the grave", origin: "Yoruba saying" },
    { id: 29, firstHalf: "When the spider webs join", trueEnding: "they can tie up a lion", origin: "Yoruba saying" },
    { id: 30, firstHalf: "A bird that flies off the earth", trueEnding: "and lands on an anthill is still on the ground", origin: "Yoruba saying" },
  ],

  // Set 7: Albanian sayings
  [
    { id: 31, firstHalf: "The brave may not live forever", trueEnding: "but the cautious do not live at all", origin: "Albanian saying" },
    { id: 32, firstHalf: "The mountain teaches silence", trueEnding: "to those who listen", origin: "Albanian saying" },
    { id: 33, firstHalf: "When the wolf comes to the door", trueEnding: "friendship runs out the window", origin: "Albanian saying" },
    { id: 34, firstHalf: "The eagle does not catch flies", trueEnding: "but the spider catches eagles", origin: "Albanian saying" },
    { id: 35, firstHalf: "Blood is thicker than water", trueEnding: "but gold is thicker than blood", origin: "Albanian saying" },
  ],

  // Set 8: Basque sayings
  [
    { id: 36, firstHalf: "The mountain that seems farthest away", trueEnding: "is the one you must climb", origin: "Basque saying" },
    { id: 37, firstHalf: "A Basque who leaves his valley", trueEnding: "leaves his soul behind", origin: "Basque saying" },
    { id: 38, firstHalf: "The pelota player who looks at the crowd", trueEnding: "misses the ball", origin: "Basque saying" },
    { id: 39, firstHalf: "The tree that gives shade", trueEnding: "does not seek the sun for itself", origin: "Basque saying" },
    { id: 40, firstHalf: "When the north wind blows", trueEnding: "even the stones learn to dance", origin: "Basque saying" },
  ],

  // Set 9: Hawaiian sayings
  [
    { id: 41, firstHalf: "The wave does not return", trueEnding: "to the shore it left", origin: "Hawaiian saying" },
    { id: 42, firstHalf: "When you paddle your own canoe", trueEnding: "you control the direction", origin: "Hawaiian saying" },
    { id: 43, firstHalf: "The coconut tree bends", trueEnding: "but does not break in the storm", origin: "Hawaiian saying" },
    { id: 44, firstHalf: "The reef teaches the wave", trueEnding: "where it cannot go", origin: "Hawaiian saying" },
    { id: 45, firstHalf: "He who plants taro", trueEnding: "thinks of the future", origin: "Hawaiian saying" },
  ],

  // Set 10: Inuit sayings
  [
    { id: 46, firstHalf: "The seal hole never freezes", trueEnding: "for the patient hunter", origin: "Inuit saying" },
    { id: 47, firstHalf: "When the aurora dances", trueEnding: "the spirits are playing", origin: "Inuit saying" },
    { id: 48, firstHalf: "The sled dog that barks at wolves", trueEnding: "remembers its wild cousins", origin: "Inuit saying" },
    { id: 49, firstHalf: "Ice that looks solid", trueEnding: "may be thin beneath", origin: "Inuit saying" },
    { id: 50, firstHalf: "The hunter who thinks he knows all", trueEnding: "starves in the plenty", origin: "Inuit saying" },
  ],

  // Set 11: Swahili sayings
  [
    { id: 51, firstHalf: "The lion that breaks the antelope's back", trueEnding: "also breaks its own tooth", origin: "Swahili saying" },
    { id: 52, firstHalf: "When elephants fight", trueEnding: "the grass suffers", origin: "Swahili saying" },
    { id: 53, firstHalf: "The tree that would grow to heaven", trueEnding: "must send its roots to hell", origin: "Swahili saying" },
    { id: 54, firstHalf: "A zebra does not despise", trueEnding: "its stripes", origin: "Swahili saying" },
    { id: 55, firstHalf: "The antelope says", trueEnding: "wherever you go the earth is one", origin: "Swahili saying" },
  ],

  // Set 12: Bulgarian sayings
  [
    { id: 56, firstHalf: "The wolf is fed", trueEnding: "by its legs", origin: "Bulgarian saying" },
    { id: 57, firstHalf: "Fear has large eyes", trueEnding: "but sees nothing", origin: "Bulgarian saying" },
    { id: 58, firstHalf: "The rose's beauty", trueEnding: "is guarded by thorns", origin: "Bulgarian saying" },
    { id: 59, firstHalf: "When God wants to punish you", trueEnding: "he sends you what you wish for", origin: "Bulgarian saying" },
    { id: 60, firstHalf: "The nightingale will not sing", trueEnding: "in a cage of gold", origin: "Bulgarian saying" },
  ],

  // Set 13: Maori sayings (New Zealand)
  [
    { id: 61, firstHalf: "The greenstone takes time to form", trueEnding: "but lasts forever", origin: "Maori saying" },
    { id: 62, firstHalf: "What is man in the presence", trueEnding: "of the mountain", origin: "Maori saying" },
    { id: 63, firstHalf: "The kumara does not speak", trueEnding: "of its own sweetness", origin: "Maori saying" },
    { id: 64, firstHalf: "Turn your face to the sun", trueEnding: "and the shadows fall behind you", origin: "Maori saying" },
    { id: 65, firstHalf: "The shark that swims alone", trueEnding: "dies alone", origin: "Maori saying" },
  ],

  // Set 14: Tamil sayings (South India)
  [
    { id: 66, firstHalf: "The elephant does not feel", trueEnding: "the weight of its own trunk", origin: "Tamil saying" },
    { id: 67, firstHalf: "When the banyan tree falls", trueEnding: "even the small birds scatter", origin: "Tamil saying" },
    { id: 68, firstHalf: "The snake that lives in the bamboo", trueEnding: "fears the sound of wind", origin: "Tamil saying" },
    { id: 69, firstHalf: "Rice tastes sweet", trueEnding: "only to the hungry", origin: "Tamil saying" },
    { id: 70, firstHalf: "The pearl diver who fears drowning", trueEnding: "will never find treasure", origin: "Tamil saying" },
  ],

  // Set 15: Tibetan sayings
  [
    { id: 71, firstHalf: "The snow lion roars", trueEnding: "but the mountain does not tremble", origin: "Tibetan saying" },
    { id: 72, firstHalf: "When the prayer flag tears", trueEnding: "the wind carries the prayers", origin: "Tibetan saying" },
    { id: 73, firstHalf: "The yak that climbs highest", trueEnding: "breathes the thinnest air", origin: "Tibetan saying" },
    { id: 74, firstHalf: "In the land of snow", trueEnding: "the sun is most precious", origin: "Tibetan saying" },
    { id: 75, firstHalf: "The monastery bell rings", trueEnding: "whether anyone listens or not", origin: "Tibetan saying" },
  ],

  // Set 16: Romanian sayings
  [
    { id: 76, firstHalf: "The wolf cannot count", trueEnding: "the sheep in the fold", origin: "Romanian saying" },
    { id: 77, firstHalf: "When the forest burns", trueEnding: "even the wet wood catches fire", origin: "Romanian saying" },
    { id: 78, firstHalf: "The bear dances", trueEnding: "but the gypsy collects the coins", origin: "Romanian saying" },
    { id: 79, firstHalf: "God strikes with one hand", trueEnding: "and caresses with the other", origin: "Romanian saying" },
    { id: 80, firstHalf: "The Danube may freeze", trueEnding: "but it never forgets the sea", origin: "Romanian saying" },
  ],

  // Set 17: Korean sayings
  [
    { id: 81, firstHalf: "Even the tiger", trueEnding: "must sleep", origin: "Korean saying" },
    { id: 82, firstHalf: "The bamboo that bends in the wind", trueEnding: "does not break", origin: "Korean saying" },
    { id: 83, firstHalf: "When the crane flies", trueEnding: "ten thousand things become quiet", origin: "Korean saying" },
    { id: 84, firstHalf: "The mountain is high", trueEnding: "but the king is far away", origin: "Korean saying" },
    { id: 85, firstHalf: "A frog in a well", trueEnding: "knows nothing of the sea", origin: "Korean saying" },
  ],

  // Set 18: Zulu sayings
  [
    { id: 86, firstHalf: "The elephant does not limp", trueEnding: "when walking on thorns", origin: "Zulu saying" },
    { id: 87, firstHalf: "When the lion sleeps", trueEnding: "the antelope does not celebrate", origin: "Zulu saying" },
    { id: 88, firstHalf: "The assegai that kills the lion", trueEnding: "was thrown by a steady hand", origin: "Zulu saying" },
    { id: 89, firstHalf: "Thunder is not yet rain", trueEnding: "but it promises water", origin: "Zulu saying" },
    { id: 90, firstHalf: "The chief's dog", trueEnding: "barks at its own shadow", origin: "Zulu saying" },
  ],

  // Set 19: Lithuanian sayings
  [
    { id: 91, firstHalf: "The amber holds", trueEnding: "yesterday's sunlight", origin: "Lithuanian saying" },
    { id: 92, firstHalf: "When the stork leaves", trueEnding: "winter follows", origin: "Lithuanian saying" },
    { id: 93, firstHalf: "The forest keeps", trueEnding: "its secrets in the roots", origin: "Lithuanian saying" },
    { id: 94, firstHalf: "A Lithuanian's heart", trueEnding: "is in his homeland", origin: "Lithuanian saying" },
    { id: 95, firstHalf: "The oak remembers", trueEnding: "what the birch forgets", origin: "Lithuanian saying" },
  ],

  // Set 20: Cherokee sayings
  [
    { id: 96, firstHalf: "The wolf you feed", trueEnding: "is the one that wins", origin: "Cherokee saying" },
    { id: 97, firstHalf: "Listen to the wind", trueEnding: "it carries the ancestors' voices", origin: "Cherokee saying" },
    { id: 98, firstHalf: "The eagle soars above", trueEnding: "but nests on the ground", origin: "Cherokee saying" },
    { id: 99, firstHalf: "When you were born you cried", trueEnding: "and everyone smiled", origin: "Cherokee saying" },
    { id: 100, firstHalf: "The earth does not belong to us", trueEnding: "we belong to the earth", origin: "Cherokee saying" },
  ]
];

// Flatten all sets into a single array for compatibility with existing code
export const SAYINGS = SAYING_SETS.flat();

// Function to get an unused set for a reader
export function getUnusedSayingSet(usedSetIndices = []) {
  const availableSetIndices = SAYING_SETS.map((_, index) => index)
    .filter(index => !usedSetIndices.includes(index));
  
  if (availableSetIndices.length === 0) {
    // All sets used, start over
    return SAYING_SETS[0];
  }
  
  const randomIndex = Math.floor(Math.random() * availableSetIndices.length);
  return SAYING_SETS[availableSetIndices[randomIndex]];
}

// Function to get the set index for a given set
export function getSayingSetIndex(sayingSet) {
  return SAYING_SETS.findIndex(set => 
    set.length === sayingSet.length && 
    set.every((saying, idx) => saying.id === sayingSet[idx].id)
  );
}

export function getRandomSaying(excludeIds = []) {
  // Ensure we have sayings to work with
  if (!SAYINGS || SAYINGS.length === 0) {
    return null
  }
  
  const availableSayings = SAYINGS.filter(p => !excludeIds.includes(p.id))
  
  // If all sayings are used, return a random one from the full set
  if (availableSayings.length === 0) {
    console.log('All sayings have been used, selecting from full set')
    const randomIndex = Math.floor(Math.random() * SAYINGS.length)
    return SAYINGS[randomIndex]
  }
  
  // Use random selection from available sayings
  const randomIndex = Math.floor(Math.random() * availableSayings.length)
  return availableSayings[randomIndex]
}