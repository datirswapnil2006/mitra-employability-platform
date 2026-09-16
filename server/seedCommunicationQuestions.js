require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('./modules/assessments/question.model');
const { Topic, Category } = require('./modules/training/training.models');

const GRAMMAR_QUESTIONS = [
  // 1. Tenses
  {
    topicTitle: 'Tenses',
    questions: [
      {
        questionText: 'She ________ in this company since 2018.',
        options: ['is working', 'has been working', 'was working', 'had worked'],
        correctAnswer: 'has been working',
        explanation: 'We use the present perfect continuous tense ("has been working") for actions that started in the past and continue into the present, usually indicated by "since" or "for".',
        difficulty: 'Easy'
      },
      {
        questionText: 'By the time the manager arrived, the team ________ the presentation.',
        options: ['completed', 'has completed', 'had completed', 'was completing'],
        correctAnswer: 'had completed',
        explanation: 'The past perfect tense ("had completed") is used for an action completed before another past action ("arrived").',
        difficulty: 'Medium'
      },
      {
        questionText: 'By next December, we ________ on this project for two years.',
        options: ['will work', 'will have been working', 'will be working', 'have worked'],
        correctAnswer: 'will have been working',
        explanation: 'Future perfect continuous ("will have been working") describes an ongoing action that will continue up to a specific time in the future.',
        difficulty: 'Hard'
      },
      {
        questionText: 'If he ________ harder, he would have passed the certification exam.',
        options: ['studied', 'had studied', 'has studied', 'would study'],
        correctAnswer: 'had studied',
        explanation: 'In third conditional sentences (hypothetical past), the if-clause takes the past perfect ("had studied") and the main clause takes "would have + past participle".',
        difficulty: 'Medium'
      },
      {
        questionText: 'The sun ________ in the east.',
        options: ['rises', 'rose', 'is rising', 'has risen'],
        correctAnswer: 'rises',
        explanation: 'Universal truths and scientific facts are always expressed in the simple present tense.',
        difficulty: 'Easy'
      },
      {
        questionText: 'I ________ him yesterday at the conference.',
        options: ['saw', 'have seen', 'had seen', 'was seeing'],
        correctAnswer: 'saw',
        explanation: 'When a specific point in past time is mentioned ("yesterday"), simple past tense ("saw") must be used.',
        difficulty: 'Easy'
      },
      {
        questionText: 'When I reached the station, the train ________ already.',
        options: ['left', 'has left', 'had left', 'leaves'],
        correctAnswer: 'had left',
        explanation: 'Past perfect ("had left") designates the earlier of two past events.',
        difficulty: 'Easy'
      },
      {
        questionText: 'Look! The children ________ in the playground.',
        options: ['play', 'are playing', 'have played', 'played'],
        correctAnswer: 'are playing',
        explanation: '"Look!" signals an action occurring at the present moment of speaking, requiring the present continuous tense.',
        difficulty: 'Easy'
      },
      {
        questionText: 'Scarcely had the speaker finished when the audience ________ applauding.',
        options: ['began', 'had begun', 'begins', 'would begin'],
        correctAnswer: 'began',
        explanation: 'Correlative conjunction "Scarcely... when" combines past perfect in the first clause with simple past ("began") in the second clause.',
        difficulty: 'Hard'
      },
      {
        questionText: 'He behaves as if he ________ everything.',
        options: ['knows', 'knew', 'has known', 'had known'],
        correctAnswer: 'knew',
        explanation: 'Subjunctive mood after "as if" / "as though" uses the past tense ("knew") to denote an unreal or hypothetical condition.',
        difficulty: 'Medium'
      },
      {
        questionText: 'We ________ each other since our college days.',
        options: ['know', 'have known', 'are knowing', 'had known'],
        correctAnswer: 'have known',
        explanation: 'Verbs of perception/cognition like "know" are stative and cannot be used in continuous tenses; present perfect ("have known") is correct with "since".',
        difficulty: 'Medium'
      },
      {
        questionText: 'Unless you ________ faster, you will miss the train.',
        options: ['run', 'will run', 'ran', 'are running'],
        correctAnswer: 'run',
        explanation: 'In conditional clauses introduced by "unless", simple present tense ("run") is used to express future condition.',
        difficulty: 'Easy'
      },
      {
        questionText: 'The flight ________ at 6:30 AM tomorrow.',
        options: ['departed', 'departs', 'has departed', 'is having departed'],
        correctAnswer: 'departs',
        explanation: 'Simple present tense ("departs") is used for scheduled future events and timetables.',
        difficulty: 'Medium'
      },
      {
        questionText: 'She confessed that she ________ a grave mistake.',
        options: ['made', 'had made', 'has made', 'makes'],
        correctAnswer: 'had made',
        explanation: 'In indirect reporting of a past action prior to the reporting verb ("confessed"), the past perfect ("had made") is required.',
        difficulty: 'Medium'
      },
      {
        questionText: 'Had I known about the meeting, I ________ attended it.',
        options: ['would have', 'will have', 'had', 'should'],
        correctAnswer: 'would have',
        explanation: 'Inverted third conditional ("Had I known...") requires "would have + past participle" in the apodosis.',
        difficulty: 'Hard'
      }
    ]
  },

  // 2. Articles
  {
    topicTitle: 'Articles',
    questions: [
      {
        questionText: 'He is ________ honest man.',
        options: ['a', 'an', 'the', 'no article'],
        correctAnswer: 'an',
        explanation: 'The word "honest" begins with a silent "h", producing a vowel sound (/ɒ/), so "an" is used.',
        difficulty: 'Easy'
      },
      {
        questionText: 'She graduated from ________ university in London.',
        options: ['a', 'an', 'the', 'no article'],
        correctAnswer: 'a',
        explanation: '"University" begins with a consonant sound (/juː/), so the indefinite article "a" is used.',
        difficulty: 'Easy'
      },
      {
        questionText: 'Mount Everest is ________ highest peak in the world.',
        options: ['a', 'an', 'the', 'no article'],
        correctAnswer: 'the',
        explanation: 'Superlative adjectives ("highest") always take the definite article "the".',
        difficulty: 'Easy'
      },
      {
        questionText: 'Copper is ________ useful metal.',
        options: ['a', 'an', 'the', 'no article'],
        correctAnswer: 'a',
        explanation: '"Useful" starts with the consonant glide /j/, therefore "a" is the appropriate article.',
        difficulty: 'Easy'
      },
      {
        questionText: 'He was appointed ________ chairman of the committee.',
        options: ['a', 'an', 'the', 'no article'],
        correctAnswer: 'no article',
        explanation: 'No article is required before predicative nouns denoting a unique post or title held by one person at a time.',
        difficulty: 'Hard'
      },
      {
        questionText: '________ Ganga is considered a sacred river in India.',
        options: ['A', 'An', 'The', 'No article'],
        correctAnswer: 'The',
        explanation: 'Names of rivers, seas, oceans, and mountain ranges always require the definite article "The".',
        difficulty: 'Easy'
      },
      {
        questionText: 'I bought ________ European watch yesterday.',
        options: ['a', 'an', 'the', 'no article'],
        correctAnswer: 'a',
        explanation: '"European" begins with the consonant sound /j/ (yoo-ro-pean), requiring the article "a".',
        difficulty: 'Medium'
      },
      {
        questionText: '________ French are known for their culinary arts.',
        options: ['A', 'An', 'The', 'No article'],
        correctAnswer: 'The',
        explanation: 'When referring to the people or nation as a collective group, "The" precedes the nationality adjective ("The French").',
        difficulty: 'Medium'
      },
      {
        questionText: 'He goes to ________ school by bus every day.',
        options: ['a', 'an', 'the', 'no article'],
        correctAnswer: 'no article',
        explanation: 'Nouns like school, church, bed, prison omit the article when visited for their primary purpose (learning).',
        difficulty: 'Hard'
      },
      {
        questionText: 'She is ________ MBA graduate from IIM Ahmedabad.',
        options: ['a', 'an', 'the', 'no article'],
        correctAnswer: 'an',
        explanation: 'The abbreviation "MBA" begins with a vowel sound (/ɛm/), so "an" is required.',
        difficulty: 'Easy'
      },
      {
        questionText: '________ rich should help the poor.',
        options: ['A', 'An', 'The', 'No article'],
        correctAnswer: 'The',
        explanation: '"The + adjective" denotes an entire class of people as a plural noun ("The rich" = rich people).',
        difficulty: 'Medium'
      },
      {
        questionText: 'This is ________ best solution we could find.',
        options: ['a', 'an', 'the', 'no article'],
        correctAnswer: 'the',
        explanation: 'Superlatives ("best") require the definite article "the".',
        difficulty: 'Easy'
      },
      {
        questionText: 'He was sent to ________ prison for committing armed robbery.',
        options: ['a', 'an', 'the', 'no article'],
        correctAnswer: 'no article',
        explanation: '"Prison" takes no article when referred to in connection with incarceration as punishment (primary purpose).',
        difficulty: 'Hard'
      },
      {
        questionText: '________ higher you climb, the colder it gets.',
        options: ['A', 'An', 'The', 'No article'],
        correctAnswer: 'The',
        explanation: 'Parallel comparison constructions use "The + comparative... the + comparative".',
        difficulty: 'Medium'
      },
      {
        questionText: 'He has ________ great deal of knowledge on data structures.',
        options: ['a', 'an', 'the', 'no article'],
        correctAnswer: 'a',
        explanation: 'The fixed idiom is "a great deal of".',
        difficulty: 'Easy'
      }
    ]
  },

  // 3. Subject-Verb Agreement
  {
    topicTitle: 'Subject-Verb Agreement',
    questions: [
      {
        questionText: 'Neither the manager nor the employees ________ present at the kickoff meeting.',
        options: ['was', 'were', 'is', 'has been'],
        correctAnswer: 'were',
        explanation: 'When subjects are connected by "neither... nor", the verb agrees in number with the nearer subject ("employees" = plural -> "were").',
        difficulty: 'Medium'
      },
      {
        questionText: 'The quality of these mangoes ________ not good.',
        options: ['is', 'are', 'were', 'have been'],
        correctAnswer: 'is',
        explanation: 'The head noun of the subject is "quality" (singular uncountable), not "mangoes", so the singular verb "is" is correct.',
        difficulty: 'Easy'
      },
      {
        questionText: 'Ten miles ________ a long distance to walk.',
        options: ['is', 'are', 'were', 'have been'],
        correctAnswer: 'is',
        explanation: 'Quantities of distance, time, weight, and money representing a single unified quantity take a singular verb.',
        difficulty: 'Easy'
      },
      {
        questionText: 'Each of the participants ________ given a certificate.',
        options: ['was', 'were', 'are', 'have been'],
        correctAnswer: 'was',
        explanation: 'Indefinite pronoun "Each" is singular and takes a singular verb ("was").',
        difficulty: 'Easy'
      },
      {
        questionText: 'The CEO, along with his advisors, ________ attending the annual summit.',
        options: ['is', 'are', 'were', 'have been'],
        correctAnswer: 'is',
        explanation: 'Parenthetical phrases like "along with", "as well as", and "together with" do not change the number of the main subject ("The CEO" -> singular).',
        difficulty: 'Medium'
      },
      {
        questionText: 'A pair of scissors ________ kept in the top drawer.',
        options: ['is', 'are', 'were', 'have been'],
        correctAnswer: 'is',
        explanation: 'While "scissors" is plural, "A pair of scissors" has "pair" as the head noun, which is singular.',
        difficulty: 'Medium'
      },
      {
        questionText: 'Either Rohan or his friends ________ responsible for organizing the event.',
        options: ['is', 'are', 'was', 'has been'],
        correctAnswer: 'are',
        explanation: 'When joined by "either... or", the verb agrees with the closer subject ("his friends" -> plural "are").',
        difficulty: 'Easy'
      },
      {
        questionText: 'The committee ________ divided in their opinions regarding the new policy.',
        options: ['was', 'were', 'is', 'has been'],
        correctAnswer: 'were',
        explanation: 'When members of a collective noun act individually or are divided in opinion, a plural verb ("were") is used.',
        difficulty: 'Hard'
      },
      {
        questionText: 'Many a student ________ failed due to lack of consistency.',
        options: ['has', 'have', 'are', 'were'],
        correctAnswer: 'has',
        explanation: 'The idiomatic structure "Many a + singular noun" always takes a singular verb ("has").',
        difficulty: 'Hard'
      },
      {
        questionText: 'Bread and butter ________ his daily breakfast.',
        options: ['is', 'are', 'were', 'have been'],
        correctAnswer: 'is',
        explanation: 'When two nouns express a single compound idea or item of food, the verb is singular.',
        difficulty: 'Easy'
      },
      {
        questionText: 'Physics ________ always been his favorite subject.',
        options: ['has', 'have', 'are', 'were'],
        correctAnswer: 'has',
        explanation: 'Names of academic subjects ending in -s (physics, mathematics, economics) take singular verbs.',
        difficulty: 'Easy'
      },
      {
        questionText: 'Not only the teacher but also the students ________ excited about the field trip.',
        options: ['was', 'were', 'is', 'has been'],
        correctAnswer: 'were',
        explanation: 'With "not only... but also", the verb agrees with the subject adjacent to it ("the students" -> "were").',
        difficulty: 'Medium'
      },
      {
        questionText: 'One of my friends ________ in Microsoft.',
        options: ['works', 'work', 'are working', 'have worked'],
        correctAnswer: 'works',
        explanation: '"One of + plural noun" takes a singular verb because the true subject is "One".',
        difficulty: 'Easy'
      },
      {
        questionText: 'The jury ________ announced its unanimous verdict.',
        options: ['has', 'have', 'are', 'were'],
        correctAnswer: 'has',
        explanation: 'The jury acted as a single unit ("its unanimous verdict"), requiring the singular verb "has".',
        difficulty: 'Medium'
      },
      {
        questionText: 'More than one candidate ________ selected for the technical role.',
        options: ['was', 'were', 'are', 'have been'],
        correctAnswer: 'was',
        explanation: '"More than one + singular noun" is grammatically singular and takes a singular verb ("was").',
        difficulty: 'Hard'
      }
    ]
  },

  // 4. Prepositions
  {
    topicTitle: 'Prepositions',
    questions: [
      {
        questionText: 'She is proficient ________ Python and machine learning.',
        options: ['in', 'at', 'with', 'for'],
        correctAnswer: 'in',
        explanation: 'The adjective "proficient" is followed by the preposition "in" when referring to a field, language, or skill.',
        difficulty: 'Easy'
      },
      {
        questionText: 'The team will meet ________ Monday morning ________ 9:00 AM.',
        options: ['on, at', 'in, at', 'at, on', 'on, in'],
        correctAnswer: 'on, at',
        explanation: 'We use "on" for days of the week ("on Monday morning") and "at" for precise clock times ("at 9:00 AM").',
        difficulty: 'Easy'
      },
      {
        questionText: 'He was prevented ________ entering the examination hall due to late arrival.',
        options: ['to', 'from', 'for', 'with'],
        correctAnswer: 'from',
        explanation: 'The verb "prevent" collocates with the preposition "from" ("prevent someone from doing something").',
        difficulty: 'Medium'
      },
      {
        questionText: 'The proposal is acceptable ________ the board of directors.',
        options: ['to', 'for', 'with', 'by'],
        correctAnswer: 'to',
        explanation: 'The adjective "acceptable" takes the preposition "to".',
        difficulty: 'Easy'
      },
      {
        questionText: 'He is addicted ________ social media scrolling.',
        options: ['with', 'to', 'for', 'in'],
        correctAnswer: 'to',
        explanation: '"Addicted" is followed by the preposition "to".',
        difficulty: 'Easy'
      },
      {
        questionText: 'She congratulated him ________ his stellar performance in the interview.',
        options: ['for', 'on', 'about', 'with'],
        correctAnswer: 'on',
        explanation: 'The verb "congratulate" strictly takes the preposition "on" (congratulate on an achievement).',
        difficulty: 'Medium'
      },
      {
        questionText: 'Distribute these chocolates ________ the two children.',
        options: ['among', 'between', 'with', 'in'],
        correctAnswer: 'between',
        explanation: '"Between" is used when referring to two distinct entities, while "among" is used for more than two.',
        difficulty: 'Easy'
      },
      {
        questionText: 'The river flows ________ the ancient stone bridge.',
        options: ['under', 'below', 'down', 'through'],
        correctAnswer: 'under',
        explanation: '"Under" is used when something is directly covered or passed beneath an object.',
        difficulty: 'Easy'
      },
      {
        questionText: 'He has been absent ________ school since last Friday.',
        options: ['from', 'in', 'at', 'to'],
        correctAnswer: 'from',
        explanation: 'The adjective "absent" requires the preposition "from".',
        difficulty: 'Easy'
      },
      {
        questionText: 'The applicant is eligible ________ the senior software developer role.',
        options: ['to', 'for', 'with', 'in'],
        correctAnswer: 'for',
        explanation: '"Eligible" is followed by "for" when specifying a post, award, or opportunity.',
        difficulty: 'Easy'
      },
      {
        questionText: 'Smoking is injurious ________ health.',
        options: ['for', 'to', 'with', 'towards'],
        correctAnswer: 'to',
        explanation: '"Injurious" takes the preposition "to", not "for".',
        difficulty: 'Medium'
      },
      {
        questionText: 'You must abide ________ the terms and conditions outlined in the agreement.',
        options: ['to', 'by', 'with', 'on'],
        correctAnswer: 'by',
        explanation: 'The phrasal verb "abide by" means to accept and obey a rule, decision, or recommendation.',
        difficulty: 'Medium'
      },
      {
        questionText: 'I am accustomed ________ working under tight sprint deadlines.',
        options: ['to', 'with', 'for', 'at'],
        correctAnswer: 'to',
        explanation: '"Accustomed" takes the preposition "to" followed by a gerund ("working").',
        difficulty: 'Medium'
      },
      {
        questionText: 'The car crashed ________ a streetlight beside the highway.',
        options: ['in', 'against', 'into', 'with'],
        correctAnswer: 'into',
        explanation: '"Crash into" conveys impact involving motion toward and collision with an object.',
        difficulty: 'Easy'
      },
      {
        questionText: 'He was acquitted ________ all criminal charges due to insufficient evidence.',
        options: ['from', 'of', 'with', 'off'],
        correctAnswer: 'of',
        explanation: 'The legal term "acquit" takes the preposition "of" ("acquit of charges").',
        difficulty: 'Hard'
      }
    ]
  },

  // 5. Active & Passive Voice
  {
    topicTitle: 'Active & Passive Voice',
    questions: [
      {
        questionText: 'Convert to Passive: "The architect designed the innovative eco-friendly building."',
        options: [
          'The innovative eco-friendly building was designed by the architect.',
          'The innovative eco-friendly building is designed by the architect.',
          'The innovative eco-friendly building had been designed by the architect.',
          'The innovative eco-friendly building was being designed by the architect.'
        ],
        correctAnswer: 'The innovative eco-friendly building was designed by the architect.',
        explanation: 'Simple past active ("designed") converts to "was/were + past participle" ("was designed") in passive voice.',
        difficulty: 'Easy'
      },
      {
        questionText: 'Convert to Passive: "The software developers are building an automated testing pipeline."',
        options: [
          'An automated testing pipeline is being built by the software developers.',
          'An automated testing pipeline was being built by the software developers.',
          'An automated testing pipeline has been built by the software developers.',
          'An automated testing pipeline is built by the software developers.'
        ],
        correctAnswer: 'An automated testing pipeline is being built by the software developers.',
        explanation: 'Present continuous active ("are building") converts to "is/are being + past participle" ("is being built").',
        difficulty: 'Easy'
      },
      {
        questionText: 'Convert to Passive: "Who wrote this outstanding algorithm?"',
        options: [
          'By whom was this outstanding algorithm written?',
          'Who was this outstanding algorithm written by?',
          'By whom had this outstanding algorithm been written?',
          'Whom was this outstanding algorithm written?'
        ],
        correctAnswer: 'By whom was this outstanding algorithm written?',
        explanation: 'Interrogative "Who" changes to "By whom + auxiliary verb + subject + past participle".',
        difficulty: 'Medium'
      },
      {
        questionText: 'Convert to Active: "The scholarship has been awarded to Priya by the committee."',
        options: [
          'The committee has awarded the scholarship to Priya.',
          'The committee had awarded the scholarship to Priya.',
          'The committee awards the scholarship to Priya.',
          'The committee is awarding the scholarship to Priya.'
        ],
        correctAnswer: 'The committee has awarded the scholarship to Priya.',
        explanation: 'Present perfect passive ("has been awarded") converts to present perfect active ("has awarded").',
        difficulty: 'Easy'
      },
      {
        questionText: 'Convert to Passive: "Close the server room door immediately."',
        options: [
          'Let the server room door be closed immediately.',
          'The server room door must be closed immediately by you.',
          'You are ordered to close the server room door.',
          'Let the door be immediately closing.'
        ],
        correctAnswer: 'Let the server room door be closed immediately.',
        explanation: 'Imperative sentences are converted using "Let + object + be + past participle".',
        difficulty: 'Medium'
      },
      {
        questionText: 'Convert to Passive: "They will publish the interview results by Friday."',
        options: [
          'The interview results will be published by Friday.',
          'The interview results would be published by Friday.',
          'The interview results will have been published by Friday.',
          'The interview results are published by Friday.'
        ],
        correctAnswer: 'The interview results will be published by Friday.',
        explanation: 'Simple future ("will publish") converts to "will be + past participle" ("will be published").',
        difficulty: 'Easy'
      },
      {
        questionText: 'Convert to Passive: "The security team had verified the credentials before issuing the pass."',
        options: [
          'The credentials had been verified by the security team before issuing the pass.',
          'The credentials were verified by the security team before issuing the pass.',
          'The credentials have been verified by the security team before issuing the pass.',
          'The credentials was being verified by the security team.'
        ],
        correctAnswer: 'The credentials had been verified by the security team before issuing the pass.',
        explanation: 'Past perfect ("had verified") becomes "had been verified" in passive voice.',
        difficulty: 'Medium'
      },
      {
        questionText: 'Convert to Passive: "One should keep one\'s promises."',
        options: [
          'Promises should be kept.',
          'One\'s promises should be kept by one.',
          'Promises ought to be kept by someone.',
          'Promises are to be kept by one.'
        ],
        correctAnswer: 'Promises should be kept.',
        explanation: 'When the active subject is the indefinite pronoun "one", it is omitted in the passive: "Promises should be kept."',
        difficulty: 'Hard'
      },
      {
        questionText: 'Convert to Passive: "The chef prepared a delectable five-course meal."',
        options: [
          'A delectable five-course meal was prepared by the chef.',
          'A delectable five-course meal had been prepared by the chef.',
          'A delectable five-course meal is prepared by the chef.',
          'A delectable five-course meal was being prepared by the chef.'
        ],
        correctAnswer: 'A delectable five-course meal was prepared by the chef.',
        explanation: 'Past simple active ("prepared") converts to "was prepared" in passive voice.',
        difficulty: 'Easy'
      },
      {
        questionText: 'Convert to Passive: "People speak English all over the world."',
        options: [
          'English is spoken all over the world.',
          'English was spoken all over the world.',
          'English has been spoken all over the world by people.',
          'English is being spoken all over the world.'
        ],
        correctAnswer: 'English is spoken all over the world.',
        explanation: 'General active subjects like "people" are dropped in passive voice ("English is spoken all over the world").',
        difficulty: 'Medium'
      },
      {
        questionText: 'Convert to Passive: "The storm destroyed dozens of seaside cottages."',
        options: [
          'Dozens of seaside cottages were destroyed by the storm.',
          'Dozens of seaside cottages was destroyed by the storm.',
          'Dozens of seaside cottages had been destroyed by the storm.',
          'Dozens of seaside cottages are destroyed by the storm.'
        ],
        correctAnswer: 'Dozens of seaside cottages were destroyed by the storm.',
        explanation: 'Plural object "Dozens of cottages" takes plural past auxiliary "were destroyed".',
        difficulty: 'Easy'
      },
      {
        questionText: 'Convert to Passive: "Can anyone solve this cryptographic puzzle?"',
        options: [
          'Can this cryptographic puzzle be solved by anyone?',
          'Could this cryptographic puzzle be solved by anyone?',
          'Can this cryptographic puzzle solved by anyone?',
          'Is this cryptographic puzzle able to be solved?'
        ],
        correctAnswer: 'Can this cryptographic puzzle be solved by anyone?',
        explanation: 'Modal auxiliary "can" retains its form: "Can + object + be + past participle".',
        difficulty: 'Medium'
      },
      {
        questionText: 'Convert to Passive: "They are painting the office building."',
        options: [
          'The office building is being painted by them.',
          'The office building was being painted by them.',
          'The office building has been painted by them.',
          'The office building is painted by them.'
        ],
        correctAnswer: 'The office building is being painted by them.',
        explanation: 'Present continuous ("are painting") converts to "is being painted".',
        difficulty: 'Easy'
      },
      {
        questionText: 'Convert to Passive: "You must complete the assignment before midnight."',
        options: [
          'The assignment must be completed before midnight.',
          'The assignment should be completed before midnight.',
          'The assignment was completed before midnight.',
          'The assignment had to be completed before midnight.'
        ],
        correctAnswer: 'The assignment must be completed before midnight.',
        explanation: '"Must + verb" becomes "must be + past participle" in passive voice.',
        difficulty: 'Easy'
      },
      {
        questionText: 'Convert to Passive: "The company will have launched the new AI platform by Q4."',
        options: [
          'The new AI platform will have been launched by the company by Q4.',
          'The new AI platform would have been launched by the company by Q4.',
          'The new AI platform will be launched by the company by Q4.',
          'The new AI platform has been launched by the company by Q4.'
        ],
        correctAnswer: 'The new AI platform will have been launched by the company by Q4.',
        explanation: 'Future perfect ("will have launched") becomes "will have been launched".',
        difficulty: 'Hard'
      }
    ]
  },

  // 6. Direct & Indirect Speech
  {
    topicTitle: 'Direct & Indirect Speech',
    questions: [
      {
        questionText: 'Change to Indirect: He said, "I am working on the database migration today."',
        options: [
          'He said that he was working on the database migration that day.',
          'He said that he is working on the database migration today.',
          'He said that he had been working on the database migration that day.',
          'He said that he worked on the database migration today.'
        ],
        correctAnswer: 'He said that he was working on the database migration that day.',
        explanation: 'Present continuous ("am working") changes to past continuous ("was working"), and time expression "today" changes to "that day".',
        difficulty: 'Easy'
      },
      {
        questionText: 'Change to Indirect: The lead said to me, "Have you submitted the code review?"',
        options: [
          'The lead asked me whether I had submitted the code review.',
          'The lead told me if I have submitted the code review.',
          'The lead asked me that had I submitted the code review.',
          'The lead inquired me whether did I submit the code review.'
        ],
        correctAnswer: 'The lead asked me whether I had submitted the code review.',
        explanation: 'Yes/No interrogative sentences use reporting verb "asked" + "if/whether" + assertive word order + past perfect ("had submitted").',
        difficulty: 'Medium'
      },
      {
        questionText: 'Change to Indirect: The teacher said, "The earth revolves around the sun."',
        options: [
          'The teacher said that the earth revolves around the sun.',
          'The teacher said that the earth revolved around the sun.',
          'The teacher said that the earth had revolved around the sun.',
          'The teacher said that the earth would revolve around the sun.'
        ],
        correctAnswer: 'The teacher said that the earth revolves around the sun.',
        explanation: 'Universal scientific truths and geographical facts do not change tense when converted into indirect speech.',
        difficulty: 'Easy'
      },
      {
        questionText: 'Change to Indirect: She said, "Alas! I have lost all my project files."',
        options: [
          'She exclaimed with sorrow that she had lost all her project files.',
          'She said with grief that I had lost all my project files.',
          'She exclaimed that she has lost all her project files.',
          'She cried that she lost all project files.'
        ],
        correctAnswer: 'She exclaimed with sorrow that she had lost all her project files.',
        explanation: 'Exclamations with "Alas!" convert to "exclaimed with sorrow/grief that" + past perfect ("had lost").',
        difficulty: 'Medium'
      },
      {
        questionText: 'Change to Indirect: The doctor said to the patient, "Take these medicines twice a day."',
        options: [
          'The doctor advised the patient to take those medicines twice a day.',
          'The doctor ordered the patient that take these medicines twice a day.',
          'The doctor suggested the patient to take these medicines twice a day.',
          'The doctor told the patient take those medicines twice a day.'
        ],
        correctAnswer: 'The doctor advised the patient to take those medicines twice a day.',
        explanation: 'Imperative advice uses "advised + object + to-infinitive", and "these" changes to "those".',
        difficulty: 'Easy'
      },
      {
        questionText: 'Change to Indirect: Anita said, "Where did you buy this mechanical keyboard?"',
        options: [
          'Anita asked where I had bought that mechanical keyboard.',
          'Anita asked that where did I buy that mechanical keyboard.',
          'Anita inquired where I bought this mechanical keyboard.',
          'Anita told where had I bought that mechanical keyboard.'
        ],
        correctAnswer: 'Anita asked where I had bought that mechanical keyboard.',
        explanation: 'Wh-questions retain the wh-word, use statement word order (subject before verb), shift simple past to past perfect ("had bought"), and change "this" to "that".',
        difficulty: 'Hard'
      },
      {
        questionText: 'Change to Indirect: He said, "I will call you tomorrow."',
        options: [
          'He said that he would call me the next day.',
          'He said that he will call me tomorrow.',
          'He said that he shall call me the following day.',
          'He told that he would call me tomorrow.'
        ],
        correctAnswer: 'He said that he would call me the next day.',
        explanation: '"Will" shifts to "would", and "tomorrow" changes to "the next day" or "the following day".',
        difficulty: 'Easy'
      },
      {
        questionText: 'Change to Indirect: "Don\'t play on the grass, boys," said the warden.',
        options: [
          'The warden forbade the boys to play on the grass.',
          'The warden ordered the boys not to play on the grass.',
          'Both A and B are correct.',
          'The warden said to boys to not play on the grass.'
        ],
        correctAnswer: 'Both A and B are correct.',
        explanation: 'Negative imperatives can be reported using "forbade + to-infinitive" or "ordered/told + not to-infinitive".',
        difficulty: 'Medium'
      },
      {
        questionText: 'Change to Indirect: Ravi said, "I must leave immediately."',
        options: [
          'Ravi said that he had to leave immediately.',
          'Ravi said that he must leave immediately.',
          'Ravi said that he should leave immediately.',
          'Ravi told that he has to leave immediately.'
        ],
        correctAnswer: 'Ravi said that he had to leave immediately.',
        explanation: 'Modal "must" expressing immediate obligation in the past shifts to "had to".',
        difficulty: 'Medium'
      },
      {
        questionText: 'Change to Indirect: She said, "What a magnificent sunset it is!"',
        options: [
          'She exclaimed that it was a very magnificent sunset.',
          'She said that what a magnificent sunset it was.',
          'She exclaimed that is was a magnificent sunset.',
          'She exclaimed with joy that what a magnificent sunset.'
        ],
        correctAnswer: 'She exclaimed that it was a very magnificent sunset.',
        explanation: 'Exclamatory sentences with "What a..." convert into declarative sentences with intensifiers like "very" and past tense ("it was a very magnificent sunset").',
        difficulty: 'Hard'
      },
      {
        questionText: 'Change to Indirect: The mentor said, "Work hard if you want to crack the placement interview."',
        options: [
          'The mentor advised us to work hard if we wanted to crack the placement interview.',
          'The mentor told us to work hard if you want to crack the placement interview.',
          'The mentor ordered that work hard if we wanted to crack the interview.',
          'The mentor suggested to work hard if you wanted to crack.'
        ],
        correctAnswer: 'The mentor advised us to work hard if we wanted to crack the placement interview.',
        explanation: 'The imperative clause becomes "to work hard", and the conditional clause shifts from "want" to "wanted".',
        difficulty: 'Medium'
      },
      {
        questionText: 'Change to Indirect: "Can you help me with this algorithm?" asked Priya.',
        options: [
          'Priya asked whether I could help her with that algorithm.',
          'Priya asked if I can help her with this algorithm.',
          'Priya told me could I help her with that algorithm.',
          'Priya requested whether I could help her with this algorithm.'
        ],
        correctAnswer: 'Priya asked whether I could help her with that algorithm.',
        explanation: '"Can" shifts to "could", "me" shifts to "her", and "this" shifts to "that".',
        difficulty: 'Easy'
      },
      {
        questionText: 'Change to Indirect: He said, "I have been waiting here for two hours."',
        options: [
          'He said that he had been waiting there for two hours.',
          'He said that he has been waiting there for two hours.',
          'He said that he was waiting here for two hours.',
          'He told that he had waited there for two hours.'
        ],
        correctAnswer: 'He said that he had been waiting there for two hours.',
        explanation: '"Have been waiting" shifts to "had been waiting", and "here" shifts to "there".',
        difficulty: 'Easy'
      },
      {
        questionText: 'Change to Indirect: Mother said to me, "May you succeed in all your endeavors!"',
        options: [
          'Mother prayed that I might succeed in all my endeavors.',
          'Mother told me that may I succeed in all my endeavors.',
          'Mother wished that I may succeed in all my endeavors.',
          'Mother prayed me to succeed in all my endeavors.'
        ],
        correctAnswer: 'Mother prayed that I might succeed in all my endeavors.',
        explanation: 'Optative sentences expressing blessings/wishes use "prayed/wished that" + subject + "might + base verb".',
        difficulty: 'Hard'
      },
      {
        questionText: 'Change to Indirect: The interviewer said, "Why did you choose computer engineering?"',
        options: [
          'The interviewer asked why I had chosen computer engineering.',
          'The interviewer asked that why did I choose computer engineering.',
          'The interviewer asked why did I choose computer engineering.',
          'The interviewer inquired that why I chose computer engineering.'
        ],
        correctAnswer: 'The interviewer asked why I had chosen computer engineering.',
        explanation: 'Wh-questions do not take "that"; the word order becomes assertive and simple past shifts to past perfect ("had chosen").',
        difficulty: 'Medium'
      }
    ]
  },

  // 7. Sentence Correction
  {
    topicTitle: 'Sentence Correction',
    questions: [
      {
        questionText: 'Find the correct sentence:',
        options: [
          'Neither of the two candidates have completed their documentation.',
          'Neither of the two candidates has completed his documentation.',
          'Neither of the two candidates have completed his documentation.',
          'Neither of the two candidates are having completed documentation.'
        ],
        correctAnswer: 'Neither of the two candidates has completed his documentation.',
        explanation: '"Neither" refers to one candidate at a time and requires a singular verb ("has") and singular pronoun ("his").',
        difficulty: 'Medium'
      },
      {
        questionText: 'Choose the grammatically correct sentence:',
        options: [
          'He is one of those employees who always works late.',
          'He is one of those employees who always work late.',
          'He is one of those employee who always work late.',
          'He is one of those employee who always works late.'
        ],
        correctAnswer: 'He is one of those employees who always work late.',
        explanation: 'In the construction "one of those + plural noun + who", the relative pronoun "who" refers to the plural noun ("employees"), so the verb must be plural ("work").',
        difficulty: 'Hard'
      },
      {
        questionText: 'Select the sentence free of redundancy:',
        options: [
          'Please revert back to me as soon as possible.',
          'Please revert to me as soon as possible.',
          'Please return back to me as soon as possible.',
          'Please reply back to me as soon as possible.'
        ],
        correctAnswer: 'Please revert to me as soon as possible.',
        explanation: '"Revert" itself means to return or reply; adding "back" is a redundant pleonasm.',
        difficulty: 'Easy'
      },
      {
        questionText: 'Identify the grammatically accurate statement:',
        options: [
          'Despite of the heavy rain, the students attended the hackathon.',
          'Despite the heavy rain, the students attended the hackathon.',
          'In spite the heavy rain, the students attended the hackathon.',
          'Despite of heavy rains, students attended the hackathon.'
        ],
        correctAnswer: 'Despite the heavy rain, the students attended the hackathon.',
        explanation: '"Despite" takes no preposition ("despite the rain"). "In spite" takes "of" ("in spite of the rain").',
        difficulty: 'Easy'
      },
      {
        questionText: 'Choose the sentence with correct modifier placement:',
        options: [
          'Walking through the campus park, the towering library was seen by Sneha.',
          'Walking through the campus park, Sneha saw the towering library.',
          'Sneha saw the towering library, walking through the campus park.',
          'The towering library was seen by Sneha, while walking through the park.'
        ],
        correctAnswer: 'Walking through the campus park, Sneha saw the towering library.',
        explanation: 'Dangling modifier error: The participial phrase "Walking through the park" must immediately precede the subject performing the action ("Sneha"), not the library.',
        difficulty: 'Hard'
      },
      {
        questionText: 'Select the correct sentence:',
        options: [
          'She is senior than me in the development department.',
          'She is senior to me in the development department.',
          'She is more senior than me in the development department.',
          'She is senior from me in the development department.'
        ],
        correctAnswer: 'She is senior to me in the development department.',
        explanation: 'Latin comparative adjectives ending in -ior (senior, junior, superior, inferior, prior) take "to", not "than".',
        difficulty: 'Easy'
      },
      {
        questionText: 'Identify the error-free sentence:',
        options: [
          'I look forward to meet you at the tech symposium.',
          'I look forward to meeting you at the tech symposium.',
          'I am looking forward to meet you at the tech symposium.',
          'I look forward for meeting you at the tech symposium.'
        ],
        correctAnswer: 'I look forward to meeting you at the tech symposium.',
        explanation: 'In the phrasal verb "look forward to", "to" is a preposition and must be followed by a gerund ("meeting").',
        difficulty: 'Medium'
      },
      {
        questionText: 'Choose the sentence with correct parallel structure:',
        options: [
          'The intern enjoys coding, debugging, and to write documentation.',
          'The intern enjoys coding, debugging, and writing documentation.',
          'The intern enjoys to code, debugging, and writing documentation.',
          'The intern enjoys coding, to debug, and documentation.'
        ],
        correctAnswer: 'The intern enjoys coding, debugging, and writing documentation.',
        explanation: 'Parallelism requires items in a series to share the same grammatical form (all gerunds: coding, debugging, writing).',
        difficulty: 'Medium'
      },
      {
        questionText: 'Select the correct sentence:',
        options: [
          'Hardly had I opened the door than the power went out.',
          'Hardly had I opened the door when the power went out.',
          'Hardly I had opened the door when the power went out.',
          'Hardly had I opened the door then the power went out.'
        ],
        correctAnswer: 'Hardly had I opened the door when the power went out.',
        explanation: '"Hardly" pairs with "when", not "than" or "then", and uses subject-verb inversion ("had I opened").',
        difficulty: 'Medium'
      },
      {
        questionText: 'Find the correct sentence:',
        options: [
          'If I was the project lead, I would adopt microservices architecture.',
          'If I were the project lead, I would adopt microservices architecture.',
          'If I am the project lead, I would adopt microservices architecture.',
          'If I would be the project lead, I would adopt microservices architecture.'
        ],
        correctAnswer: 'If I were the project lead, I would adopt microservices architecture.',
        explanation: 'In unreal hypothetical conditionals (second conditional), the subjunctive "were" is used for all persons ("If I were...").',
        difficulty: 'Easy'
      },
      {
        questionText: 'Identify the correct sentence:',
        options: [
          'No sooner did the bell ring when the students left the classroom.',
          'No sooner did the bell ring than the students left the classroom.',
          'No sooner had the bell rung when the students left the classroom.',
          'No sooner did the bell rang than the students left the classroom.'
        ],
        correctAnswer: 'No sooner did the bell ring than the students left the classroom.',
        explanation: '"No sooner" must be followed by "than", not "when".',
        difficulty: 'Medium'
      },
      {
        questionText: 'Select the sentence with accurate pronoun agreement:',
        options: [
          'Every student must submit their project proposal by Monday.',
          'Every student must submit his or her project proposal by Monday.',
          'Every students must submit his or her project proposal by Monday.',
          'All student must submit their project proposal by Monday.'
        ],
        correctAnswer: 'Every student must submit his or her project proposal by Monday.',
        explanation: '"Every student" is singular and traditionally takes the singular pronoun "his or her".',
        difficulty: 'Medium'
      },
      {
        questionText: 'Which sentence is grammatically correct?',
        options: [
          'The climate of Pune is better than Mumbai.',
          'The climate of Pune is better than that of Mumbai.',
          'The climate of Pune is better than those of Mumbai.',
          'The climate of Pune is more better than Mumbai.'
        ],
        correctAnswer: 'The climate of Pune is better than that of Mumbai.',
        explanation: 'Illogical comparison: Pune\'s climate must be compared to Mumbai\'s climate ("that of Mumbai"), not to the city itself.',
        difficulty: 'Hard'
      },
      {
        questionText: 'Select the grammatically correct sentence:',
        options: [
          'He has been working in this lab for the last five years.',
          'He is working in this lab for the last five years.',
          'He was working in this lab for the last five years.',
          'He worked in this lab since five years.'
        ],
        correctAnswer: 'He has been working in this lab for the last five years.',
        explanation: 'Actions beginning in the past and persisting to the present take present perfect continuous ("has been working") with "for" indicating duration.',
        difficulty: 'Easy'
      },
      {
        questionText: 'Choose the correct sentence:',
        options: [
          'Between you and I, this software architecture is deeply flawed.',
          'Between you and me, this software architecture is deeply flawed.',
          'Between you and myself, this software architecture is deeply flawed.',
          'Among you and me, this software architecture is deeply flawed.'
        ],
        correctAnswer: 'Between you and me, this software architecture is deeply flawed.',
        explanation: '"Between" is a preposition, requiring objective case pronouns ("you and me", not "you and I").',
        difficulty: 'Hard'
      }
    ]
  },

  // 8. Parts of Speech
  {
    topicTitle: 'Parts of Speech',
    questions: [
      {
        questionText: 'Identify the part of speech of the underlined word: "She spoke <softly> during the interview."',
        options: ['Noun', 'Adjective', 'Adverb', 'Verb'],
        correctAnswer: 'Adverb',
        explanation: '"Softly" modifies the verb "spoke", answering the question "how", making it an adverb of manner.',
        difficulty: 'Easy'
      },
      {
        questionText: 'In the sentence "The <fast> train arrived on time," what part of speech is "fast"?',
        options: ['Noun', 'Adjective', 'Adverb', 'Preposition'],
        correctAnswer: 'Adjective',
        explanation: '"Fast" directly modifies the noun "train", so it functions as an adjective.',
        difficulty: 'Easy'
      },
      {
        questionText: 'In the sentence "He ran <fast> to catch the morning flight," what part of speech is "fast"?',
        options: ['Noun', 'Adjective', 'Adverb', 'Verb'],
        correctAnswer: 'Adverb',
        explanation: 'Here "fast" modifies the action verb "ran", explaining the manner of running, so it is an adverb.',
        difficulty: 'Easy'
      },
      {
        questionText: 'Identify the part of speech: "Honesty is the best policy." What is "Honesty"?',
        options: ['Abstract Noun', 'Proper Noun', 'Collective Noun', 'Adjective'],
        correctAnswer: 'Abstract Noun',
        explanation: '"Honesty" names an intangible quality or virtue, classifying it as an abstract noun.',
        difficulty: 'Easy'
      },
      {
        questionText: 'In "The team celebrated its victory," what type of noun is "team"?',
        options: ['Common Noun', 'Proper Noun', 'Collective Noun', 'Abstract Noun'],
        correctAnswer: 'Collective Noun',
        explanation: '"Team" denotes a collection of individuals acting as a unit, which is a collective noun.',
        difficulty: 'Easy'
      },
      {
        questionText: 'Identify the conjunction in the sentence: "We must hurry, <otherwise> we will miss the bus."',
        options: ['must', 'hurry', 'otherwise', 'miss'],
        correctAnswer: 'otherwise',
        explanation: '"Otherwise" joins the two independent clauses expressing condition/consequence, functioning as a conjunction.',
        difficulty: 'Medium'
      },
      {
        questionText: 'In "She hurt <herself> while assembling the hardware kit," what kind of pronoun is "herself"?',
        options: ['Reflexive Pronoun', 'Emphatic Pronoun', 'Demonstrative Pronoun', 'Relative Pronoun'],
        correctAnswer: 'Reflexive Pronoun',
        explanation: 'When the subject and the object of the verb are the same entity ("She hurt herself"), it is a reflexive pronoun.',
        difficulty: 'Medium'
      },
      {
        questionText: 'Identify the part of speech of the capitalized word: "BRAVO! You solved the algorithmic challenge."',
        options: ['Conjunction', 'Interjection', 'Preposition', 'Adverb'],
        correctAnswer: 'Interjection',
        explanation: '"Bravo" is an interjection expressing exclamation, praise, or strong emotion.',
        difficulty: 'Easy'
      },
      {
        questionText: 'In the phrase "a <swimming> pool", what grammatical role does "swimming" play?',
        options: ['Gerund acting as noun adjunct', 'Present Participle', 'Infinitive', 'Finite Verb'],
        correctAnswer: 'Gerund acting as noun adjunct',
        explanation: 'In "swimming pool" (a pool FOR swimming), "swimming" is a gerund functioning as a noun adjunct/modifier.',
        difficulty: 'Hard'
      },
      {
        questionText: 'Identify the transitive verb in: "The architect designed a scalable cloud architecture."',
        options: ['architect', 'designed', 'scalable', 'cloud'],
        correctAnswer: 'designed',
        explanation: '"Designed" is a transitive verb because it transfers action to a direct object ("a scalable cloud architecture").',
        difficulty: 'Medium'
      },
      {
        questionText: 'In "This is the developer <who> resolved the critical bug," what is "who"?',
        options: ['Personal Pronoun', 'Relative Pronoun', 'Interrogative Pronoun', 'Demonstrative Pronoun'],
        correctAnswer: 'Relative Pronoun',
        explanation: '"Who" introduces a relative adjective clause and refers back to the antecedent "developer".',
        difficulty: 'Easy'
      },
      {
        questionText: 'In "She is <extremely> intelligent," what part of speech is "extremely"?',
        options: ['Adjective', 'Adverb of degree', 'Noun', 'Conjunction'],
        correctAnswer: 'Adverb of degree',
        explanation: '"Extremely" modifies the adjective "intelligent", indicating the degree or intensity.',
        difficulty: 'Easy'
      },
      {
        questionText: 'Identify the coordinating conjunction: "He was tired, yet he continued writing code."',
        options: ['was', 'tired', 'yet', 'continued'],
        correctAnswer: 'yet',
        explanation: '"Yet" is one of the standard coordinating conjunctions (FANBOYS: For, And, Nor, But, Or, Yet, So).',
        difficulty: 'Medium'
      },
      {
        questionText: 'In "Water the plants daily," what part of speech is "Water"?',
        options: ['Noun', 'Verb', 'Adjective', 'Adverb'],
        correctAnswer: 'Verb',
        explanation: 'In this imperative sentence, "Water" functions as an action verb meaning to pour water upon.',
        difficulty: 'Medium'
      },
      {
        questionText: 'In "He has <little> patience for careless mistakes," what part of speech is "little"?',
        options: ['Adjective of quantity', 'Adverb', 'Pronoun', 'Noun'],
        correctAnswer: 'Adjective of quantity',
        explanation: '"Little" describes the quantity of the uncountable noun "patience", functioning as an adjective of quantity.',
        difficulty: 'Medium'
      }
    ]
  }
];

async function seedGrammarQuestions() {
  try {
    console.log('[Seed]: Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Seed]: Connected successfully.');

    // 1. Locate Communication Grammar Category
    let grammarCat = await Category.findOne({ module: 'Communication', title: 'Grammar' });
    if (!grammarCat) {
      console.log('[Seed]: Grammar category not found, checking by title...');
      grammarCat = await Category.findOne({ title: 'Grammar' });
    }

    if (!grammarCat) {
      console.error('[Seed Error]: Grammar category does not exist in database. Aborting.');
      process.exit(1);
    }

    console.log(`[Seed]: Found Grammar category with ID: ${grammarCat._id}`);

    // 2. Load all topics under Grammar
    const grammarTopics = await Topic.find({
      module: 'Communication',
      categoryId: grammarCat._id
    });

    console.log(`[Seed]: Found ${grammarTopics.length} topics under Grammar.`);
    const topicMap = new Map();
    grammarTopics.forEach(t => topicMap.set(t.title.trim().toLowerCase(), t));

    let totalInserted = 0;

    for (const group of GRAMMAR_QUESTIONS) {
      const targetTopicDoc = topicMap.get(group.topicTitle.trim().toLowerCase());
      const topicId = targetTopicDoc ? targetTopicDoc._id : null;

      console.log(`[Seed]: Seeding ${group.questions.length} questions for "${group.topicTitle}" (Topic ID: ${topicId || 'None'})...`);

      for (const q of group.questions) {
        // Check for existing question
        const exists = await Question.findOne({
          questionText: q.questionText.trim()
        });

        if (!exists) {
          await Question.create({
            module: 'Communication',
            category: 'Grammar',
            categoryId: grammarCat._id,
            topic: group.topicTitle,
            topicId: topicId,
            questionText: q.questionText.trim(),
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || '',
            difficulty: q.difficulty || 'Medium',
            marks: 1,
            type: 'mcq',
            status: 'active',
            aiGenerated: false,
            aiProvider: 'manual'
          });
          totalInserted++;
        }
      }
    }

    console.log(`[Seed]: Successfully inserted ${totalInserted} new Grammar questions!`);
    const totalNow = await Question.countDocuments({ module: 'Communication' });
    console.log(`[Seed]: Total Communication questions in database now: ${totalNow}`);

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
}

seedGrammarQuestions();
