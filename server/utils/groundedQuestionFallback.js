/**
 * Grounded Question Fallback Engine
 * Provides deterministic, academically verified and schema-compliant questions
 * across Aptitude, Programming (C/C++/Java/Python), SQL/DBMS, Technical Domains,
 * and Psychometric evaluations.
 */

/**
 * Shuffles options of a grounded question using Fisher-Yates, preserving
 * the exact correctAnswer text. Likert scales (psychometric) are not shuffled.
 */
const shuffleGroundedOptions = (q) => {
  if (!q || !Array.isArray(q.options) || q.options.length <= 1) return q;
  if (q.type === 'psychometric') return q;
  const shuffled = [...q.options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return {
    ...q,
    options: shuffled
  };
};

const isGenericTopic = (topic = '', category = '', module = '') => {
  const t = String(topic || '').toLowerCase().trim();
  const c = String(category || '').toLowerCase().trim();
  const m = String(module || '').toLowerCase().trim();
  if (!t || t === 'general' || t === 'all' || t === 'all topics' || t === 'mixed' || t === 'arithmetic' || t === 'puzzles' || t === 'partial' || t.startsWith('initial') || t.startsWith('test') || t.startsWith('sample')) return true;
  if (t === c || t === m) return true;
  if (t.includes('general') || t === 'quantitative aptitude' || t === 'logical reasoning' || t === 'verbal ability' || t === 'aptitude' || t === 'math') return true;
  return false;
};

// 1. QUANTITATIVE APTITUDE GENERATOR
const generateQuantQuestion = (seed, difficulty = 'Medium', topic = '') => {
  const i = Math.abs(seed);
  let typeIndex = i % 8;

  if (topic && !isGenericTopic(topic, 'Quantitative Aptitude', 'Aptitude')) {
    const clean = topic.toLowerCase().trim();
    if (clean.includes('time') && clean.includes('work') || clean.includes('pipe') || clean.includes('cistern')) {
      typeIndex = 0;
    } else if (clean.includes('profit') || clean.includes('loss') || clean.includes('discount')) {
      typeIndex = 1;
    } else if (clean.includes('interest') || clean.includes('simple interest') || clean.includes('compound interest') || clean.includes('si') || clean.includes('ci')) {
      typeIndex = 2;
    } else if (clean.includes('speed') || clean.includes('distance') || clean.includes('train') || clean.includes('boat')) {
      typeIndex = 3;
    } else if (clean.includes('probab') || clean.includes('dice') || clean.includes('urn')) {
      typeIndex = 4;
    } else if (clean.includes('percent') || clean.includes('ratio') || clean.includes('proportion')) {
      typeIndex = 5;
    } else if (clean.includes('number') || clean.includes('divisib') || clean.includes('remainder')) {
      typeIndex = 6;
    } else if (clean.includes('age') || clean.includes('average') || clean.includes('mean')) {
      typeIndex = 7;
    } else {
      // Specific topic requested that is not covered by quantitative fallback templates.
      // Do not silently insert an unrelated question!
      return null;
    }
  }

  switch (typeIndex) {
    case 0: { // Time & Work
      const subjects = [
        ['Worker A', 'Worker B', 'software development task'],
        ['Pipe X', 'Pipe Y', 'filling a storage reservoir'],
        ['Developer Alex', 'Developer Bob', 'refactoring a codebase'],
        ['Machine Alpha', 'Machine Beta', 'manufacturing an order'],
        ['Technician Ken', 'Technician Sam', 'calibrating a network cluster']
      ];
      const [wA, wB, taskName] = subjects[i % subjects.length];
      const a = 12 + (i % 7) * 3;
      const b = 15 + (i % 6) * 4;
      const time = ((a * b) / (a + b)).toFixed(1);
      const ans = `${time} days`;
      return {
        questionText: `${wA} can finish a ${taskName} in ${a} days, and ${wB} can complete the same work in ${b} days. Working concurrently at constant speed, how many days will both take to complete the work?`,
        options: [ans, `${(parseFloat(time) + 2.5).toFixed(1)} days`, `${(parseFloat(time) - 1.8).toFixed(1)} days`, `${((a + b) / 2).toFixed(1)} days`],
        correctAnswer: ans,
        explanation: `Combined rate per day = (1/${a} + 1/${b}) = (${a + b})/(${a * b}). Total required duration = (${a * b})/(${a + b}) = ${time} days.`,
        type: 'mcq',
        difficulty
      };
    }
    case 1: { // Profit & Loss
      const roles = [
        ['A shopkeeper', 'an electronic device'],
        ['A wholesale merchant', 'a shipment of textiles'],
        ['An online seller', 'a computer peripheral'],
        ['A hardware vendor', 'a set of server tools'],
        ['A distributor', 'a batch of components']
      ];
      const [trader, item] = roles[i % roles.length];
      const cp = 600 + (i % 9) * 60 + (Math.floor(i / 10) * 25);
      const profitPct = 10 + (i % 5) * 5;
      const sp = Math.round(cp * (1 + profitPct / 100));
      const ans = `₹${sp}`;
      return {
        questionText: `${trader} purchases ${item} for ₹${cp} and sells it at a profit margin of ${profitPct}%. What is the final selling price of the item?`,
        options: [ans, `₹${sp + 45}`, `₹${sp - 40}`, `₹${cp + profitPct * 2}`],
        correctAnswer: ans,
        explanation: `Selling Price = Cost Price × (100 + Profit%) / 100 = ₹${cp} × ${100 + profitPct} / 100 = ₹${sp}.`,
        type: 'mcq',
        difficulty
      };
    }
    case 2: { // Simple & Compound Interest
      const accounts = [
        'bank fixed deposit scheme',
        'mutual fund capital investment',
        'commercial venture fund',
        'treasury infrastructure bond',
        'corporate credit facility'
      ];
      const accountName = accounts[i % accounts.length];
      const p = 8000 + (i % 7) * 1500 + (Math.floor(i / 8) * 500);
      const r = 5 + (i % 5) * 2;
      const t = 2 + (i % 3);
      const si = (p * r * t) / 100;
      const ans = `₹${si}`;
      return {
        questionText: `Calculate the simple interest accumulated on a principal sum of ₹${p} allocated in a ${accountName} for ${t} years at an annual interest rate of ${r}%.`,
        options: [ans, `₹${si + 180}`, `₹${si - 150}`, `₹${si + 320}`],
        correctAnswer: ans,
        explanation: `Simple Interest = (Principal × Rate × Time) / 100 = (${p} × ${r} × ${t}) / 100 = ₹${si}.`,
        type: 'mcq',
        difficulty
      };
    }
    case 3: { // Speed, Time and Distance
      const vehicles = [
        ['An express train', 'signal gantry'],
        ['A high-speed locomotive', 'telegraph pole'],
        ['A commuter train', 'mile marker'],
        ['A cargo freight train', 'railway bridge post'],
        ['An electric metro train', 'platform checkpoint']
      ];
      const [veh, marker] = vehicles[i % vehicles.length];
      const speedKm = 54 + (i % 5) * 18 + (Math.floor(i / 10) * 10);
      const speedMs = speedKm * (5 / 18);
      const timeSec = 12 + (i % 4) * 3;
      const dist = Math.round(speedMs * timeSec);
      const ans = `${dist} meters`;
      return {
        questionText: `${veh} travelling at a uniform velocity of ${speedKm} km/h passes a stationary ${marker} in ${timeSec} seconds. What is the total length of the train?`,
        options: [ans, `${dist + 60} meters`, `${dist - 45} meters`, `${dist + 120} meters`],
        correctAnswer: ans,
        explanation: `Speed in m/s = ${speedKm} × (5/18) = ${speedMs.toFixed(2)} m/s. Length = Speed × Time = ${dist} meters.`,
        type: 'mcq',
        difficulty
      };
    }
    case 4: { // Probability
      const red = 4 + (i % 3);
      const blue = 8 + (i % 3);
      const green = 3 + (i % 2);
      const total = red + blue + green;
      const ans = `${blue}/${total}`;
      const uniqueOpts = [
        ans,
        `${red}/${total}`,
        `${green}/${total}`,
        `${red + green}/${total}`
      ];
      return {
        questionText: `An urn contains ${red} red tokens, ${blue} blue tokens, and ${green} green tokens. If a single token is selected at random, what is the probability that it is blue?`,
        options: uniqueOpts,
        correctAnswer: ans,
        explanation: `Total tokens = ${red} + ${blue} + ${green} = ${total}. Favorable blue outcomes = ${blue}. Probability = ${blue}/${total}.`,
        type: 'mcq',
        difficulty
      };
    }
    case 5: { // Percentage & Ratio
      const total = 500 + (i % 5) * 100;
      const passPct = 65;
      const passed = (total * passPct) / 100;
      const failed = total - passed;
      const ans = `${failed}`;
      return {
        questionText: `In an entrance assessment with ${total} test takers, ${passPct}% of candidates passed. How many candidates failed the examination?`,
        options: [ans, `${failed + 25}`, `${failed - 20}`, `${passed}`],
        correctAnswer: ans,
        explanation: `Failure percentage = 100% - ${passPct}% = 35%. Number of failed candidates = 35% of ${total} = ${failed}.`,
        type: 'mcq',
        difficulty
      };
    }
    case 6: { // Number System & Divisibility
      const mult = 11;
      const baseNum = 3400 + (i % 10) * 10;
      const rem = baseNum % mult;
      const toAdd = rem === 0 ? 7 : mult - rem;
      const ans = `${toAdd}`;
      const numOpts = [ans, `${toAdd + 2}`, `${toAdd + 4}`, `${toAdd + 6}`];
      return {
        questionText: `What is the least positive integer that must be added to ${baseNum} so that the resulting number is completely divisible by ${mult}?`,
        options: numOpts,
        correctAnswer: ans,
        explanation: `Dividing ${baseNum} by ${mult} yields remainder ${rem}. Required addition = ${mult} - ${rem} = ${toAdd}.`,
        type: 'mcq',
        difficulty
      };
    }
    default: { // Averages & Ages
      const currChild = 8 + (i % 4) * 2;
      const currFather = currChild * 4;
      const years = 6;
      const fatherFuture = currFather + years;
      const childFuture = currChild + years;
      const ans = `${fatherFuture} and ${childFuture}`;
      return {
        questionText: `A parent is currently 4 times as old as their child. If the child is currently ${currChild} years old, what will be their respective ages after ${years} years?`,
        options: [ans, `${fatherFuture + 4} and ${childFuture - 2}`, `${fatherFuture - 3} and ${childFuture + 3}`, `${currFather * 2} and ${currChild * 2}`],
        correctAnswer: ans,
        explanation: `Current ages: Child = ${currChild}, Parent = 4 × ${currChild} = ${currFather}. In ${years} years: Parent = ${fatherFuture}, Child = ${childFuture}.`,
        type: 'mcq',
        difficulty
      };
    }
  }
};

// 2. LOGICAL REASONING GENERATOR
const generateLogicalQuestion = (seed, difficulty = 'Medium', topic = '') => {
  const i = Math.abs(seed);
  let typeIndex = i % 5;

  if (topic && !isGenericTopic(topic, 'Logical Reasoning', 'Aptitude')) {
    const clean = topic.toLowerCase().trim();
    if (clean.includes('coding') || clean.includes('decoding') || clean.includes('cipher')) {
      typeIndex = 0;
    } else if (clean.includes('blood') || clean.includes('relation') || clean.includes('kinship')) {
      typeIndex = 1;
    } else if (clean.includes('syllogism') || clean.includes('deduction')) {
      typeIndex = 2;
    } else if (clean.includes('series') || clean.includes('progression') || clean.includes('sequence')) {
      typeIndex = 3;
    } else if (clean.includes('direction') || clean.includes('distance') || clean.includes('sense')) {
      typeIndex = 4;
    } else {
      // Specific topic not covered by logical fallback templates.
      return null;
    }
  }

  switch (typeIndex) {
    case 0: { // Coding Decoding
      return {
        questionText: `In a specific cryptographic cipher, if 'GLOBAL' is encoded as 'HMPCBN', how is 'SERVER' encoded under the same rule?`,
        options: ['TFSWFS', 'TFRWES', 'SGSEFS', 'TETWFS'],
        correctAnswer: 'TFSWFS',
        explanation: `Each character is shifted forward by +1 position in the alphabet: S->T, E->F, R->S, V->W, E->F, R->S. Result is 'TFSWFS'.`,
        type: 'mcq',
        difficulty
      };
    }
    case 1: { // Blood Relations
      return {
        questionText: `Introducing a speaker, an engineer states: "Her brother's father is the only son of my grandfather." How is the engineer related to the speaker?`,
        options: ['Brother or Sister', 'Father', 'Uncle', 'Cousin'],
        correctAnswer: 'Brother or Sister',
        explanation: `The only son of the grandfather is the speaker's and engineer's father. Therefore, the engineer is the brother or sister of the speaker.`,
        type: 'mcq',
        difficulty
      };
    }
    case 2: { // Syllogisms
      return {
        questionText: `Statements: (1) All microservices are APIs. (2) Some APIs are secure endpoints. Conclusion: (I) Some microservices are secure endpoints. (II) All secure endpoints are APIs.`,
        options: ['Neither conclusion follows', 'Only conclusion I follows', 'Only conclusion II follows', 'Both conclusions follow'],
        correctAnswer: 'Neither conclusion follows',
        explanation: `From a universal affirmative and a particular affirmative with undistributed middle term, neither conclusion I nor conclusion II definitely follows.`,
        type: 'mcq',
        difficulty
      };
    }
    case 3: { // Number Series
      const a = 3 + (i % 4);
      const b = a * 2;
      const c = b * 2;
      const d = c * 2;
      const next = d * 2;
      return {
        questionText: `Identify the next number in the progression sequence: ${a}, ${b}, ${c}, ${d}, ...?`,
        options: [`${next}`, `${next + 8}`, `${next - 6}`, `${next * 2}`],
        correctAnswer: `${next}`,
        explanation: `Each consecutive term is obtained by multiplying the previous term by 2. The next term is ${d} × 2 = ${next}.`,
        type: 'mcq',
        difficulty
      };
    }
    default: { // Direction Sense
      return {
        questionText: `A technician walks 12 meters North, turns right and walks 5 meters East. What is the direct shortest distance from the starting position?`,
        options: ['13 meters', '17 meters', '15 meters', '11 meters'],
        correctAnswer: '13 meters',
        explanation: `Applying the Pythagorean theorem: distance = √(12² + 5²) = √(144 + 25) = √169 = 13 meters.`,
        type: 'mcq',
        difficulty
      };
    }
  }
};

// 3. VERBAL ABILITY GENERATOR
const generateVerbalQuestion = (seed, difficulty = 'Medium') => {
  const i = Math.abs(seed);
  const items = [
    {
      q: `Select the option that correctly identifies the synonym of the word 'PRAGMATIC':`,
      opts: ['Practical and realistic', 'Overly idealistic', 'Hesitant to act', 'Strictly theoretical'],
      ans: 'Practical and realistic',
      exp: `'Pragmatic' refers to dealing with things sensibly and realistically in a way that is based on practical considerations.`
    },
    {
      q: `Identify the grammatically correct sentence among the following options:`,
      opts: [
        'Neither the manager nor the engineers were present at the briefing.',
        'Neither the manager nor the engineers was present at the briefing.',
        'Neither the manager nor the engineers has been present at the briefing.',
        'Neither the manager nor the engineers is present at the briefing.'
      ],
      ans: 'Neither the manager nor the engineers were present at the briefing.',
      exp: `With 'neither...nor', the verb agrees in number with the subject closest to it ('engineers' is plural, requiring 'were').`
    },
    {
      q: `Choose the correct preposition to complete the sentence: "The team complied _______ all security compliance guidelines."`,
      opts: ['with', 'to', 'for', 'about'],
      ans: 'with',
      exp: `The verb 'comply' takes the preposition 'with' when denoting acting in accordance with a rule or command.`
    },
    {
      q: `Select the word that is nearest in opposite meaning (antonym) to 'METICULOUS':`,
      opts: ['Careless', 'Diligent', 'Accurate', 'Thorough'],
      ans: 'Careless',
      exp: `'Meticulous' means showing great attention to detail; its opposite is 'careless' or sloppy.`
    }
  ];
  const choice = items[i % items.length];
  return {
    questionText: choice.q,
    options: choice.opts,
    correctAnswer: choice.ans,
    explanation: choice.exp,
    type: 'mcq',
    difficulty
  };
};

// 4. PROGRAMMING (C, C++, Java, Python) GENERATOR
const generateProgrammingQuestion = (seed, language = 'Java', difficulty = 'Medium') => {
  const i = Math.abs(seed);
  const lang = String(language).toLowerCase();

  if (lang.includes('python')) {
    const listOps = [
      {
        q: 'What will be the output of the following Python snippet?',
        code: `x = [1, 2, 3]\ny = x\ny.append(4)\nprint(len(x))`,
        opts: ['4', '3', 'Error', 'None'],
        ans: '4',
        exp: 'In Python, lists are mutable objects and assigning y = x creates a reference to the same list. Modifying y alters x.'
      },
      {
        q: 'What is the return value of the following Python dictionary expression?',
        code: `d = {"a": 1, "b": 2}\nprint(d.get("c", 99))`,
        opts: ['99', 'None', 'KeyError', '0'],
        ans: '99',
        exp: 'dict.get(key, default) returns the specified default value (99) if the key is not present, avoiding a KeyError.'
      }
    ];
    const pick = listOps[i % listOps.length];
    return {
      questionText: pick.q,
      codeSnippet: pick.code,
      options: pick.opts,
      correctAnswer: pick.ans,
      explanation: pick.exp,
      type: 'coding',
      difficulty
    };
  }

  if (lang.includes('c++') || lang === 'cpp') {
    return {
      questionText: 'What is the role of virtual destructors in a C++ base class?',
      codeSnippet: `class Base {\npublic:\n    virtual ~Base() {}\n};`,
      options: [
        'Ensures derived class destructors are called when deleting via base pointer',
        'Prevents objects of the base class from being instantiated',
        'Automatically allocates memory in heap storage',
        'Forces derived classes to implement a custom constructor'
      ],
      correctAnswer: 'Ensures derived class destructors are called when deleting via base pointer',
      explanation: 'Declaring a destructor virtual ensures that when an object is deleted through a pointer to the base class, the derived class destructor is invoked properly, preventing resource leaks.',
      type: 'coding',
      difficulty
    };
  }

  if (lang === 'c' || lang.includes('c programming')) {
    return {
      questionText: 'In C, what is the output of the following pointer arithmetic expression?',
      codeSnippet: `int arr[] = {10, 20, 30};\nint *ptr = arr;\nprintf("%d", *(ptr + 1));`,
      options: ['20', '10', '30', 'Undefined behavior'],
      correctAnswer: '20',
      explanation: 'ptr points to arr[0]. The expression *(ptr + 1) accesses the adjacent integer element arr[1], which has the value 20.',
      type: 'coding',
      difficulty
    };
  }

  // Default Java
  return {
    questionText: 'What will be the result of executing the following Java code snippet?',
    codeSnippet: `String s1 = "Hello";\nString s2 = new String("Hello");\nSystem.out.println(s1 == s2);`,
    options: ['false', 'true', 'Compilation Error', 'NullPointerException'],
    correctAnswer: 'false',
    explanation: 'The == operator in Java evaluates object memory reference equality. s1 points to the string pool literal, while s2 is an allocated heap object, resulting in false.',
    type: 'coding',
    difficulty
  };
};

// 5. SQL / DBMS GENERATOR
const generateSqlQuestion = (seed, difficulty = 'Medium') => {
  const i = Math.abs(seed);
  const sqlItems = [
    {
      q: 'Which SQL clause is used to filter records based on aggregated metric calculations (e.g. COUNT, AVG)?',
      schema: 'CREATE TABLE employees (id INT PRIMARY KEY, department_id INT, salary DECIMAL);',
      query: 'SELECT department_id, COUNT(*) FROM employees GROUP BY department_id HAVING COUNT(*) > 5;',
      opts: ['HAVING clause', 'WHERE clause', 'ORDER BY clause', 'GROUP BY clause'],
      ans: 'HAVING clause',
      exp: 'The HAVING clause filters rows after aggregations are calculated, whereas WHERE filters individual rows before aggregation.'
    },
    {
      q: 'Given an Orders table and Customers table, which JOIN returns all customers even if they have placed no orders?',
      schema: 'CREATE TABLE customers (id INT, name VARCHAR);\nCREATE TABLE orders (id INT, customer_id INT, amount DECIMAL);',
      query: 'SELECT c.name, o.amount FROM customers c LEFT JOIN orders o ON c.id = o.customer_id;',
      opts: ['LEFT OUTER JOIN', 'INNER JOIN', 'RIGHT OUTER JOIN', 'CROSS JOIN'],
      ans: 'LEFT OUTER JOIN',
      exp: 'A LEFT OUTER JOIN preserves all records from the left table (customers), pairing unmatched right rows with NULL values.'
    },
    {
      q: 'What is the effect of the UNIQUE constraint on a column in SQL?',
      schema: 'CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(100) UNIQUE);',
      query: 'ALTER TABLE users ADD CONSTRAINT uq_email UNIQUE(email);',
      opts: [
        'Ensures all values in the column are distinct across rows',
        'Prevents NULL values from ever being stored',
        'Automatically creates a clustered primary key index',
        'Encrypts data stored in the column'
      ],
      ans: 'Ensures all values in the column are distinct across rows',
      exp: 'A UNIQUE constraint enforces uniqueness of values in a column. Most SQL engines allow at most one NULL under a standard unique constraint.'
    }
  ];

  const pick = sqlItems[i % sqlItems.length];
  return {
    questionText: pick.q,
    schemaSql: pick.schema,
    referenceQuery: pick.query,
    options: pick.opts,
    correctAnswer: pick.ans,
    explanation: pick.exp,
    type: 'sql',
    difficulty
  };
};

// 6. TECHNICAL DOMAIN GENERATOR (CSE, IT, ECE, MECH, etc.)
const generateTechnicalDomainQuestion = (seed, department = 'CSE', difficulty = 'Medium') => {
  const i = Math.abs(seed);
  const dept = String(department).toUpperCase();

  if (dept === 'ECE') {
    return {
      questionText: 'What is the primary function of a Schmitt Trigger in analog signal conditioning circuits?',
      options: [
        'Converts noisy analog input signals into clean digital square pulses with hysteresis',
        'Amplifies low-frequency audio signals with zero phase distortion',
        'Modulates carrier frequencies in radio frequency transmitters',
        'Acts as an ideal low-pass Butterworth filter'
      ],
      correctAnswer: 'Converts noisy analog input signals into clean digital square pulses with hysteresis',
      explanation: 'A Schmitt trigger is a comparator circuit with hysteresis that prevents false switching caused by noise on slow-moving signals.',
      type: 'mcq',
      difficulty
    };
  }

  if (dept === 'MECH') {
    return {
      questionText: 'According to the Second Law of Thermodynamics, which thermodynamic cycle exhibits the highest theoretical thermal efficiency between two heat reservoirs?',
      options: ['Carnot Cycle', 'Rankine Cycle', 'Otto Cycle', 'Diesel Cycle'],
      correctAnswer: 'Carnot Cycle',
      explanation: 'The Carnot cycle is a reversible thermodynamic cycle operating between two isothermal and two isentropic processes, establishing the maximum theoretical efficiency limit.',
      type: 'mcq',
      difficulty
    };
  }

  // Default CSE / IT
  const cseQuestions = [
    {
      q: 'Which indexing data structure is most widely implemented for secondary storage indexing in relational databases due to high fan-out?',
      opts: ['B+ Tree', 'Binary Search Tree', 'Red-Black Tree', 'Splay Tree'],
      ans: 'B+ Tree',
      exp: 'B+ Trees store all actual records/pointers in leaf nodes linked sequentially, offering shallow tree height and optimal sequential disk I/O.'
    },
    {
      q: 'In operating systems, what is the critical condition required to prevent a Deadlock by eliminating the "Hold and Wait" condition?',
      opts: [
        'Processes must request all required resources simultaneously at initialization',
        'Allow preemption of allocated CPU registers',
        'Enforce linear order numbering on resource types',
        'Implement virtual memory paging'
      ],
      ans: 'Processes must request all required resources simultaneously at initialization',
      exp: 'Eliminating Hold and Wait requires that a process requests all needed resources at once, or releases current resources before requesting new ones.'
    }
  ];

  const pick = cseQuestions[i % cseQuestions.length];
  return {
    questionText: pick.q,
    options: pick.opts,
    correctAnswer: pick.ans,
    explanation: pick.exp,
    type: 'mcq',
    difficulty
  };
};

// 7. PSYCHOMETRIC & BEHAVIORAL GENERATOR
const generatePsychometricQuestion = (seed, competency = 'Teamwork', difficulty = 'Medium') => {
  const i = Math.abs(seed);
  const behavioralScenarios = [
    {
      comp: 'Teamwork',
      q: 'When team members disagree on architectural choices for a project milestone, I actively facilitate a compromise that balances performance with project deadlines.',
      opts: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
      rule: [1, 2, 3, 4, 5]
    },
    {
      comp: 'Problem Solving',
      q: 'When confronted with an unexpected production issue with minimal documentation, I systematically decompose the logs and isolate variables before escalating.',
      opts: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
      rule: [1, 2, 3, 4, 5]
    },
    {
      comp: 'Leadership',
      q: 'I proactively take accountability for project outcomes, providing mentorship and clear direction to junior peers when facing ambiguous project specifications.',
      opts: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
      rule: [1, 2, 3, 4, 5]
    },
    {
      comp: 'Adaptability',
      q: 'I quickly pivot my workflow and learn unfamiliar technology stacks when customer priorities or project scope changes abruptly.',
      opts: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
      rule: [1, 2, 3, 4, 5]
    }
  ];

  const item = behavioralScenarios[i % behavioralScenarios.length];
  return {
    questionText: item.q,
    options: item.opts,
    correctAnswer: item.opts[4], // Strongly Agree as high-performance baseline
    explanation: `Evaluates behavioral competence in ${item.comp} during professional and engineering scenarios.`,
    type: 'psychometric',
    competency: competency || item.comp,
    scoringRule: item.rule,
    difficulty
  };
};

/**
 * Main dispatcher to generate a grounded question by section and type
 */
const generateGroundedQuestion = ({
  type = 'mcq',
  module = 'Aptitude',
  category = 'Quantitative',
  department = null,
  topic = 'General',
  difficulty = 'Medium',
  seed = 0
}) => {
  const cleanCategory = String(category || '').toLowerCase();
  const cleanModule = String(module || '').toLowerCase();
  const cleanTopic = String(topic || '').toLowerCase();

  let generated = null;

  // 1. SQL / DBMS
  if (type === 'sql' || cleanCategory.includes('sql') || cleanCategory.includes('dbms') || cleanTopic.includes('sql')) {
    generated = generateSqlQuestion(seed, difficulty);
  }
  // 2. Coding / Language (C, C++, Java, Python)
  else if (type === 'coding' || type === 'output' ||
      cleanCategory.includes('java') || cleanCategory.includes('python') || cleanCategory.includes('c++') || cleanCategory.includes('c programming') ||
      cleanTopic.includes('java') || cleanTopic.includes('python') || cleanTopic.includes('c++')) {
    const lang = cleanCategory.includes('python') || cleanTopic.includes('python') ? 'Python' :
                 (cleanCategory.includes('c++') || cleanTopic.includes('c++') ? 'C++' : (cleanCategory.includes('c programming') || cleanTopic.includes('c programming') || cleanCategory === 'c' ? 'C' : 'Java'));
    generated = generateProgrammingQuestion(seed, lang, difficulty);
  }
  // 3. Psychometric
  else if (type === 'psychometric' || cleanModule.includes('psychometric') || cleanCategory.includes('behavior') || cleanCategory.includes('personality')) {
    generated = generatePsychometricQuestion(seed, category, difficulty);
  }
  // 4. Aptitude Sections
  else if (cleanCategory.includes('quant') || cleanTopic.includes('quant') || cleanCategory.includes('arithmetic')) {
    generated = generateQuantQuestion(seed, difficulty, topic);
  }
  else if (cleanCategory.includes('logic') || cleanCategory.includes('reason') || cleanTopic.includes('reason')) {
    generated = generateLogicalQuestion(seed, difficulty, topic);
  }
  else if (cleanCategory.includes('verbal') || cleanCategory.includes('english') || cleanTopic.includes('verbal')) {
    generated = generateVerbalQuestion(seed, difficulty);
  }
  // 5. Technical Domain
  else if (cleanModule.includes('domain') || department || cleanCategory.includes('cse') || cleanCategory.includes('ece') || cleanCategory.includes('mech')) {
    generated = generateTechnicalDomainQuestion(seed, department || category || 'CSE', difficulty);
  }
  // Default balanced Aptitude if topic is generic
  else if (isGenericTopic(topic, category, module)) {
    const cycle = Math.abs(seed) % 3;
    if (cycle === 0) generated = generateQuantQuestion(seed, difficulty, topic);
    else if (cycle === 1) generated = generateLogicalQuestion(seed, difficulty, topic);
    else generated = generateVerbalQuestion(seed, difficulty);
  } else {
    // Specific topic outside known domains - cannot produce topic-specific question.
    return null;
  }

  if (!generated) return null;
  return shuffleGroundedOptions(generated);
};

/**
 * Generates an array of count grounded questions
 */
const generateGroundedQuestionsBatch = ({
  count = 5,
  type = 'mcq',
  module = 'Aptitude',
  category = 'Quantitative',
  department = null,
  topic = 'General',
  difficulty = 'Medium',
  seedOffset = 0
}) => {
  const result = [];
  for (let idx = 0; idx < count; idx++) {
    const q = generateGroundedQuestion({
      type,
      module,
      category,
      department,
      topic,
      difficulty,
      seed: seedOffset + idx + 1
    });
    if (!q) {
      // Cannot produce topic-specific fallback question; do not pad with unrelated questions
      break;
    }
    result.push({
      ...q,
      section: topic || category || module,
      module: module || 'Aptitude',
      category: category || 'Quantitative',
      department: department || null,
      marks: 1
    });
  }
  return result;
};

module.exports = {
  generateGroundedQuestion,
  generateGroundedQuestionsBatch,
  shuffleGroundedOptions,
  generateQuantQuestion,
  generateLogicalQuestion,
  generateVerbalQuestion,
  generateProgrammingQuestion,
  generateSqlQuestion,
  generateTechnicalDomainQuestion,
  generatePsychometricQuestion
};
