const mongoose = require('mongoose');
require('dotenv').config();
const { Assessment } = require('./modules/assessments/assessment.models');
const Question = require('./modules/assessments/question.model');
const { Category, Topic } = require('./modules/training/training.models');

async function seedDomainQuestionBank() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mitra_employability');
  console.log('[Seed] Connected to MongoDB.');

  // 1. Extract embedded questions from existing Domain assessments
  const domainAssessments = await Assessment.find({ module: { $in: ['Domain', 'Domain Knowledge'] } });
  console.log(`[Seed] Found ${domainAssessments.length} domain assessments to extract from.`);

  let extractedCount = 0;
  for (const a of domainAssessments) {
    if (!a.questions || a.questions.length === 0) continue;
    for (const q of a.questions) {
      if (!q.questionText || !q.options || q.options.length < 2) continue;
      const existing = await Question.findOne({
        questionText: q.questionText.trim(),
        module: 'Domain'
      });
      if (!existing) {
        await Question.create({
          questionText: q.questionText.trim(),
          codeSnippet: q.codeSnippet || '',
          type: q.type || 'mcq',
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          difficulty: q.difficulty || a.difficulty || 'Medium',
          marks: q.marks || 1,
          module: 'Domain',
          department: a.department,
          departmentId: a.departmentId,
          category: a.category,
          categoryId: a.categoryId,
          topic: a.topic || a.title,
          topicId: a.topicId,
          status: 'active'
        });
        extractedCount++;
      }
    }
  }
  console.log(`[Seed] Extracted ${extractedCount} new questions from existing assessments into Question collection.`);

  // 2. Comprehensive Core Questions for all 9 Academic Departments
  const deptQuestionPacks = {
    Mechanical: [
      {
        category: 'Thermodynamics',
        topic: 'Laws of Thermodynamics',
        questions: [
          {
            questionText: 'Which law of thermodynamics defines the concept of temperature and thermal equilibrium?',
            options: ['Zeroth Law', 'First Law', 'Second Law', 'Third Law'],
            correctAnswer: 'Zeroth Law',
            explanation: 'The Zeroth Law of Thermodynamics states that if two systems are each in thermal equilibrium with a third system, they are in thermal equilibrium with each other, defining temperature.',
            difficulty: 'Easy'
          },
          {
            questionText: 'In a closed system undergoing an adiabatic process, the heat transfer (Q) is:',
            options: ['Q = 0', 'Q > 0', 'Q < 0', 'Q = W'],
            correctAnswer: 'Q = 0',
            explanation: 'An adiabatic process is one in which no heat enters or leaves the system, meaning Q = 0.',
            difficulty: 'Easy'
          },
          {
            questionText: 'The Carnot cycle efficiency depends solely on:',
            options: ['The temperatures of the heat source and sink', 'The working fluid properties', 'The pressure ratio', 'The volume of the cylinder'],
            correctAnswer: 'The temperatures of the heat source and sink',
            explanation: 'Carnot efficiency is η = 1 - (T_L / T_H), depending strictly on the absolute temperatures of the reservoir and sink.',
            difficulty: 'Medium'
          },
          {
            questionText: 'What happens to the entropy of an isolated system in any spontaneous irreversible process?',
            options: ['It always increases', 'It remains constant', 'It decreases', 'It becomes zero'],
            correctAnswer: 'It always increases',
            explanation: 'According to the Second Law of Thermodynamics, the total entropy of an isolated system always increases over time for irreversible processes.',
            difficulty: 'Medium'
          },
          {
            questionText: 'For an ideal gas, the difference between specific heats (Cp - Cv) is equal to:',
            options: ['Gas constant R', 'Universal gas constant Ru', 'Adiabatic index γ', 'Zero'],
            correctAnswer: 'Gas constant R',
            explanation: 'Mayers relation states that Cp - Cv = R for an ideal gas.',
            difficulty: 'Easy'
          }
        ]
      },
      {
        category: 'Fluid Mechanics',
        topic: 'Fluid Dynamics & Bernoulli',
        questions: [
          {
            questionText: 'Bernoullis equation is based on the conservation of which quantity?',
            options: ['Energy', 'Mass', 'Momentum', 'Angular momentum'],
            correctAnswer: 'Energy',
            explanation: 'Bernoullis equation represents the conservation of mechanical energy for an incompressible, inviscid, steady fluid flow.',
            difficulty: 'Easy'
          },
          {
            questionText: 'In laminar flow through a circular pipe, the velocity distribution across the diameter follows which profile?',
            options: ['Parabolic', 'Hyperbolic', 'Linear', 'Uniform'],
            correctAnswer: 'Parabolic',
            explanation: 'In fully developed laminar flow (Hagen-Poiseuille flow), shear stress variation leads to a parabolic velocity distribution.',
            difficulty: 'Medium'
          },
          {
            questionText: 'A pitot tube is primarily used to measure which parameter in a fluid stream?',
            options: ['Stagnation / Local flow velocity', 'Viscosity', 'Static pressure only', 'Discharge rate directly'],
            correctAnswer: 'Stagnation / Local flow velocity',
            explanation: 'A pitot tube measures stagnation pressure to compute local flow velocity in a pipe or duct.',
            difficulty: 'Easy'
          },
          {
            questionText: 'The Reynolds number for pipe flow below which the flow is typically considered laminar is:',
            options: ['2000', '4000', '10000', '500'],
            correctAnswer: '2000',
            explanation: 'For flow through circular conduits, Re < 2000 corresponds to the laminar regime.',
            difficulty: 'Easy'
          },
          {
            questionText: 'Which fluid property causes resistance to deformation under shear stress?',
            options: ['Dynamic viscosity', 'Surface tension', 'Vapor pressure', 'Capillarity'],
            correctAnswer: 'Dynamic viscosity',
            explanation: 'Dynamic viscosity is the measure of a fluids internal resistance to gradual deformation by shear or tensile stress.',
            difficulty: 'Easy'
          }
        ]
      },
      {
        category: 'Strength of Materials',
        topic: 'Stress and Strain',
        questions: [
          {
            questionText: 'Hooks Law is valid up to which limit of a material?',
            options: ['Proportional limit', 'Elastic limit', 'Yield point', 'Ultimate tensile point'],
            correctAnswer: 'Proportional limit',
            explanation: 'Hooks Law states stress is directly proportional to strain strictly up to the proportional limit.',
            difficulty: 'Easy'
          },
          {
            questionText: 'The ratio of lateral strain to longitudinal strain within the elastic limit is known as:',
            options: ['Poissons ratio', 'Youngs modulus', 'Modulus of rigidity', 'Bulk modulus'],
            correctAnswer: 'Poissons ratio',
            explanation: 'Poissons ratio (ν) is defined as the absolute ratio of transverse strain to axial strain under uniaxial loading.',
            difficulty: 'Easy'
          },
          {
            questionText: 'A beam subjected to pure bending exhibits zero bending stress at which layer?',
            options: ['Neutral axis', 'Extreme top fiber', 'Extreme bottom fiber', 'Midway to the support'],
            correctAnswer: 'Neutral axis',
            explanation: 'Along the neutral axis of a beam in bending, normal stresses and longitudinal strains are zero.',
            difficulty: 'Easy'
          },
          {
            questionText: 'What is the relation between Youngs Modulus (E), Shear Modulus (G), and Poissons Ratio (ν)?',
            options: ['E = 2G(1 + ν)', 'E = 3G(1 - 2ν)', 'E = 2G(1 - ν)', 'G = 2E(1 + ν)'],
            correctAnswer: 'E = 2G(1 + ν)',
            explanation: 'The fundamental elasticity relation connects Youngs Modulus E and Shear Modulus G via E = 2G(1 + ν).',
            difficulty: 'Medium'
          },
          {
            questionText: 'The polar moment of inertia (J) for a solid circular shaft of diameter D is:',
            options: ['(π * D^4) / 32', '(π * D^4) / 64', '(π * D^3) / 16', '(π * D^4) / 12'],
            correctAnswer: '(π * D^4) / 32',
            explanation: 'For a solid shaft, polar moment of inertia J = Ix + Iy = 2 * (π * D^4 / 64) = (π * D^4) / 32.',
            difficulty: 'Medium'
          }
        ]
      }
    ],

    Civil: [
      {
        category: 'Structural Analysis',
        topic: 'Trusses and Beams',
        questions: [
          {
            questionText: 'A plane truss is statically determinate externally and internally if it satisfies which formula (m: members, j: joints, r: reactions)?',
            options: ['m + r = 2j', 'm + r > 2j', 'm + 2r = j', '2m + r = j'],
            correctAnswer: 'm + r = 2j',
            explanation: 'For static determinacy in a 2D pin-jointed truss, total unknowns (m + r) must equal total available joint equilibrium equations (2j).',
            difficulty: 'Medium'
          },
          {
            questionText: 'In a simply supported beam of length L carrying a uniformly distributed load (w), the maximum bending moment occurs at:',
            options: ['L / 2', 'L / 4', 'At the supports', 'L / 3'],
            correctAnswer: 'L / 2',
            explanation: 'Symmetry places the maximum bending moment (wL^2/8) at midspan (L/2) where shear force changes sign to zero.',
            difficulty: 'Easy'
          },
          {
            questionText: 'Slenderness ratio of a compression column is defined as the ratio of effective length to:',
            options: ['Least radius of gyration', 'Cross-sectional area', 'Total height', 'Maximum radius of gyration'],
            correctAnswer: 'Least radius of gyration',
            explanation: 'Slenderness ratio λ = L_eff / r_min, where r_min is the least radius of gyration.',
            difficulty: 'Easy'
          },
          {
            questionText: 'What is the shape of the bending moment diagram for a cantilever beam with a point load at its free end?',
            options: ['Linear (triangle)', 'Parabolic', 'Cubic', 'Rectangular'],
            correctAnswer: 'Linear (triangle)',
            explanation: 'Bending moment varies linearly with distance x from the free end (M = -P * x).',
            difficulty: 'Easy'
          },
          {
            questionText: 'The point where the bending moment changes sign in a continuous beam is called:',
            options: ['Point of contraflexure', 'Neutral point', 'Yield point', 'Point of zero shear'],
            correctAnswer: 'Point of contraflexure',
            explanation: 'The point of contraflexure (or inflection) is where the bending moment is zero and reverses curvature.',
            difficulty: 'Easy'
          }
        ]
      },
      {
        category: 'Geotechnical Engineering',
        topic: 'Soil Mechanics',
        questions: [
          {
            questionText: 'Darcy’s law is valid for laminar groundwater flow through soil having Reynolds number:',
            options: ['Less than 1', 'Greater than 2000', 'Between 500 and 1000', 'Exactly 100'],
            correctAnswer: 'Less than 1',
            explanation: 'Darcys law assumes laminar seepage flow through porous soil media, typically valid for Re <= 1.',
            difficulty: 'Medium'
          },
          {
            questionText: 'The ratio of volume of voids to total volume of a soil mass is called:',
            options: ['Porosity', 'Void ratio', 'Degree of saturation', 'Air content'],
            correctAnswer: 'Porosity',
            explanation: 'Porosity n = V_voids / V_total, while void ratio e = V_voids / V_solids.',
            difficulty: 'Easy'
          },
          {
            questionText: 'Which soil consistency limit corresponds to the boundary between plastic state and liquid state?',
            options: ['Liquid limit', 'Plastic limit', 'Shrinkage limit', 'Optimum moisture limit'],
            correctAnswer: 'Liquid limit',
            explanation: 'The liquid limit (LL) is the water content at which soil transitions from plastic to liquid behavior.',
            difficulty: 'Easy'
          },
          {
            questionText: 'Standard Proctor test is conducted on soil to determine:',
            options: ['Maximum dry density and optimum moisture content', 'Permeability coefficient', 'Shear strength parameters', 'Specific gravity'],
            correctAnswer: 'Maximum dry density and optimum moisture content',
            explanation: 'Proctor compaction tests plot dry unit weight vs water content to locate OMC and MDD.',
            difficulty: 'Easy'
          },
          {
            questionText: 'Mohr-Coulomb failure criterion expresses shear strength (τ) of soil as:',
            options: ['c + σ * tan(φ)', 'c * σ + tan(φ)', 'c * tan(φ) + σ', 'c / (σ * tan(φ))'],
            correctAnswer: 'c + σ * tan(φ)',
            explanation: 'The Mohr-Coulomb equation is τ = c + σ * tan(φ), where c is cohesion and φ is the angle of internal friction.',
            difficulty: 'Medium'
          }
        ]
      }
    ],

    AIDS: [
      {
        category: 'Machine Learning',
        topic: 'Supervised Learning',
        questions: [
          {
            questionText: 'Which metric is best suited for evaluating a classification model on an imbalanced dataset?',
            options: ['F1-Score / PR-AUC', 'Accuracy', 'Mean Squared Error', 'Explained Variance'],
            correctAnswer: 'F1-Score / PR-AUC',
            explanation: 'In imbalanced domains, raw accuracy is deceptive. F1-score balances precision and recall to evaluate minority class effectiveness.',
            difficulty: 'Medium'
          },
          {
            questionText: 'In Linear Regression, the cost function optimized by Ordinary Least Squares is:',
            options: ['Sum of Squared Errors (SSE)', 'Hinge Loss', 'Categorical Cross-Entropy', 'Kullback-Leibler Divergence'],
            correctAnswer: 'Sum of Squared Errors (SSE)',
            explanation: 'OLS minimizes the sum of squared differences between observed and predicted continuous values.',
            difficulty: 'Easy'
          },
          {
            questionText: 'Which regularization technique adds the absolute value of coefficients (L1 penalty) to the loss function?',
            options: ['Lasso Regression', 'Ridge Regression', 'Elastic Net', 'Dropout'],
            correctAnswer: 'Lasso Regression',
            explanation: 'Lasso (L1) uses absolute magnitude penalties, encouraging sparsity and automated feature selection.',
            difficulty: 'Easy'
          },
          {
            questionText: 'In Random Forest classifiers, randomness is introduced through:',
            options: ['Bootstrap sampling of data and random feature subsets at each split', 'Random activation functions', 'Stochastic weight initialization only', 'Random learning rates'],
            correctAnswer: 'Bootstrap sampling of data and random feature subsets at each split',
            explanation: 'Random Forest applies bagging (bootstrap aggregating) alongside random feature subspaces to decorrelate individual trees.',
            difficulty: 'Medium'
          },
          {
            questionText: 'What problem occurs when a machine learning model fits training data too closely and fails on unseen validation data?',
            options: ['Overfitting', 'Underfitting', 'High bias', 'Data leakage'],
            correctAnswer: 'Overfitting',
            explanation: 'Overfitting corresponds to high variance where model memorizes noise in the training set.',
            difficulty: 'Easy'
          }
        ]
      },
      {
        category: 'Deep Learning',
        topic: 'Neural Networks & CNNs',
        questions: [
          {
            questionText: 'Which activation function is most widely used in hidden layers of deep neural networks to mitigate vanishing gradients?',
            options: ['ReLU (Rectified Linear Unit)', 'Sigmoid', 'Tanh', 'Linear'],
            correctAnswer: 'ReLU (Rectified Linear Unit)',
            explanation: 'ReLU outputs f(x) = max(0, x), maintaining constant gradient of 1 for positive inputs and speeding up training.',
            difficulty: 'Easy'
          },
          {
            questionText: 'In a Convolutional Neural Network (CNN), what is the primary role of a Max Pooling layer?',
            options: ['Downsample spatial dimensions while retaining prominent features', 'Increase parameters for better capacity', 'Calculate cross-entropy loss', 'Convert continuous features into binary masks'],
            correctAnswer: 'Downsample spatial dimensions while retaining prominent features',
            explanation: 'Max pooling reduces spatial resolution (H x W), providing translational invariance and reducing computational overhead.',
            difficulty: 'Easy'
          },
          {
            questionText: 'Which mechanism enables Transformer architectures to process input tokens in parallel rather than sequentially?',
            options: ['Self-Attention Mechanism', 'Recurrent feedback loops', 'Max Pooling', 'LSTM gates'],
            correctAnswer: 'Self-Attention Mechanism',
            explanation: 'Multi-Head Self-Attention calculates pairwise token affinities concurrently across the whole sequence without recurrent steps.',
            difficulty: 'Medium'
          },
          {
            questionText: 'What is the role of Batch Normalization during deep neural network training?',
            options: ['Normalizes layer inputs to stabilize and accelerate gradient convergence', 'Increases model parameters', 'Replaces dropout for classification', 'Compresses images before passing to GPU'],
            correctAnswer: 'Normalizes layer inputs to stabilize and accelerate gradient convergence',
            explanation: 'Batch Normalization standardizes mean and variance of mini-batch activations, mitigating internal covariate shift.',
            difficulty: 'Medium'
          },
          {
            questionText: 'Which optimizer adaptively calculates per-parameter learning rates using first and second moments of gradients?',
            options: ['Adam (Adaptive Moment Estimation)', 'Standard SGD', 'Momentum SGD', 'Adagrad without decay'],
            correctAnswer: 'Adam (Adaptive Moment Estimation)',
            explanation: 'Adam combines exponentially decaying average of past gradients (momentum) and past squared gradients (RMSprop).',
            difficulty: 'Medium'
          }
        ]
      }
    ],

    'CSE (IOT)': [
      {
        category: 'IoT Protocols & Architecture',
        topic: 'Networking and Messaging',
        questions: [
          {
            questionText: 'Which lightweight publish-subscribe messaging protocol is designed specifically for constrained IoT devices with low bandwidth?',
            options: ['MQTT', 'HTTP / REST', 'FTP', 'SMTP'],
            correctAnswer: 'MQTT',
            explanation: 'MQTT (Message Queuing Telemetry Transport) operates over TCP/IP with minimal header overhead, ideal for constrained IoT devices.',
            difficulty: 'Easy'
          },
          {
            questionText: 'In MQTT, what does QoS level 1 guarantee?',
            options: ['At least once delivery', 'At most once delivery', 'Exactly once delivery', 'No delivery acknowledgement'],
            correctAnswer: 'At least once delivery',
            explanation: 'MQTT QoS 0 is at most once, QoS 1 is at least once (acknowledged delivery), and QoS 2 is exactly once.',
            difficulty: 'Medium'
          },
          {
            questionText: 'CoAP (Constrained Application Protocol) runs primarily on top of which transport protocol?',
            options: ['UDP', 'TCP', 'SCTP', 'ICMP'],
            correctAnswer: 'UDP',
            explanation: 'CoAP is designed for constrained web devices and uses UDP (port 5683) to minimize handshake latency and connection overhead.',
            difficulty: 'Medium'
          },
          {
            questionText: 'Which wireless standard provides low-power wide-area networking (LPWAN) up to 10-15 kilometers for IoT sensors?',
            options: ['LoRaWAN', 'Bluetooth Classic', 'Wi-Fi 802.11b', 'Zigbee (short-range)'],
            correctAnswer: 'LoRaWAN',
            explanation: 'LoRaWAN offers long-range (up to 15 km in rural settings) low-power telemetry transmission for battery-powered IoT nodes.',
            difficulty: 'Easy'
          },
          {
            questionText: 'What is the standard IPv6 adaptation layer used to enable IP connectivity over low-power wireless personal area networks?',
            options: ['6LoWPAN', 'IPv4 NAT', 'DNS-SD', 'mDNS'],
            correctAnswer: '6LoWPAN',
            explanation: '6LoWPAN (IPv6 over Low-Power Wireless Personal Area Networks) provides header compression and packet fragmentation.',
            difficulty: 'Medium'
          }
        ]
      }
    ],

    MCA: [
      {
        category: 'Web & Full Stack Development',
        topic: 'Modern Web Architecture',
        questions: [
          {
            questionText: 'In RESTful APIs, which HTTP method is strictly intended to be idempotent and safe without modifying server state?',
            options: ['GET', 'POST', 'PATCH', 'CONNECT'],
            correctAnswer: 'GET',
            explanation: 'HTTP GET retrieves representation of resources without producing side-effects on the server.',
            difficulty: 'Easy'
          },
          {
            questionText: 'In React, what hook is used to handle side-effects such as data fetching, subscriptions, and DOM updates?',
            options: ['useEffect', 'useState', 'useMemo', 'useContext'],
            correctAnswer: 'useEffect',
            explanation: 'useEffect runs side-effects after DOM render cycles, supporting cleanup subscriptions upon unmount.',
            difficulty: 'Easy'
          },
          {
            questionText: 'Which data structure does a B-Tree index in a relational database optimize for?',
            options: ['Disk-based search, sequential access, and range queries', 'In-memory LIFO ordering', 'Unordered hashing', 'FIFO message queues'],
            correctAnswer: 'Disk-based search, sequential access, and range queries',
            explanation: 'B-Trees minimize disk I/O operations through high fanout and keep keys balanced for O(log N) searches and range scans.',
            difficulty: 'Medium'
          },
          {
            questionText: 'What is the function of CORS (Cross-Origin Resource Sharing) in modern browsers?',
            options: ['Security mechanism allowing servers to restrict resource requests from other origins', 'Compresses JSON payloads over HTTP/2', 'Caches static assets in Service Workers', 'Encrypts WebSocket frames'],
            correctAnswer: 'Security mechanism allowing servers to restrict resource requests from other origins',
            explanation: 'CORS uses HTTP headers to tell browsers whether a web application running at one origin has permission to access resources at another origin.',
            difficulty: 'Easy'
          },
          {
            questionText: 'In MongoDB, which operator is used to join documents from another collection in an aggregation pipeline?',
            options: ['$lookup', '$match', '$project', '$unwind'],
            correctAnswer: '$lookup',
            explanation: '$lookup performs a left outer join to an unsharded collection in the same database.',
            difficulty: 'Easy'
          }
        ]
      }
    ],

    MBA: [
      {
        category: 'Marketing Management',
        topic: 'Marketing Fundamentals',
        questions: [
          {
            questionText: 'Which elements constitute the traditional 4 Ps of the Marketing Mix?',
            options: ['Product, Price, Place, Promotion', 'People, Process, Physical Evidence, Profit', 'Planning, Production, Placement, Positioning', 'Performance, Promise, Perception, Price'],
            correctAnswer: 'Product, Price, Place, Promotion',
            explanation: 'E. Jerome McCarthys classic Marketing Mix framework consists of Product, Price, Place, and Promotion.',
            difficulty: 'Easy'
          },
          {
            questionText: 'In the BCG Matrix, products with high market growth rate and high relative market share are called:',
            options: ['Stars', 'Cash Cows', 'Question Marks', 'Dogs'],
            correctAnswer: 'Stars',
            explanation: 'Stars generate and consume significant amounts of cash due to their dominant market position in high-growth industries.',
            difficulty: 'Easy'
          },
          {
            questionText: 'SWOT analysis evaluates which four dimensions of an organization?',
            options: ['Strengths, Weaknesses, Opportunities, Threats', 'Strategy, Workforce, Operations, Targets', 'Sales, Worth, Objectives, Trajectory', 'Structure, Wealth, Output, Trends'],
            correctAnswer: 'Strengths, Weaknesses, Opportunities, Threats',
            explanation: 'SWOT is a strategic planning tool analyzing internal (Strengths, Weaknesses) and external (Opportunities, Threats) factors.',
            difficulty: 'Easy'
          },
          {
            questionText: 'Customer Lifetime Value (CLV) measures:',
            options: ['Total net revenue an enterprise anticipates gaining over the entire duration of a customer relationship', 'The acquisition cost of a single customer in Q1', 'Average transaction size of a retail customer', 'Number of referrals generated per year'],
            correctAnswer: 'Total net revenue an enterprise anticipates gaining over the entire duration of a customer relationship',
            explanation: 'CLV estimates the total monetary value a customer brings to the business throughout their lifecycle.',
            difficulty: 'Medium'
          },
          {
            questionText: 'In Porters Five Forces framework, which force assesses the ease with which buyers can drive down prices?',
            options: ['Bargaining power of buyers', 'Threat of new entrants', 'Bargaining power of suppliers', 'Industry rivalry'],
            correctAnswer: 'Bargaining power of buyers',
            explanation: 'Buyer power analyzes customer price sensitivity and the ability of customers to negotiate terms and prices.',
            difficulty: 'Easy'
          }
        ]
      },
      {
        category: 'Financial Management',
        topic: 'Corporate Finance & Accounting',
        questions: [
          {
            questionText: 'The fundamental accounting equation is expressed as:',
            options: ['Assets = Liabilities + Shareholders Equity', 'Assets = Revenue - Expenses', 'Equity = Assets + Liabilities', 'Net Income = Assets - Debt'],
            correctAnswer: 'Assets = Liabilities + Shareholders Equity',
            explanation: 'The balance sheet identity establishes that total company assets are financed by either debt (liabilities) or equity.',
            difficulty: 'Easy'
          },
          {
            questionText: 'Net Present Value (NPV) evaluates capital investments by:',
            options: ['Discounting projected cash flows to their present value and subtracting initial investment', 'Dividing total revenue by payback years', 'Multiplying net profit by corporate tax rate', 'Adding depreciation to gross profit'],
            correctAnswer: 'Discounting projected cash flows to their present value and subtracting initial investment',
            explanation: 'NPV represents current dollar value of future cash inflows minus current outflows discounted at required rate of return.',
            difficulty: 'Medium'
          },
          {
            questionText: 'Which financial ratio measures a company’s ability to cover its short-term obligations with its most liquid assets?',
            options: ['Quick Ratio (Acid-Test)', 'Debt-to-Equity Ratio', 'Return on Assets', 'Gross Profit Margin'],
            correctAnswer: 'Quick Ratio (Acid-Test)',
            explanation: 'The Quick Ratio = (Cash + Marketable Securities + Receivables) / Current Liabilities, excluding illiquid inventory.',
            difficulty: 'Easy'
          },
          {
            questionText: 'Working Capital of a firm is calculated as:',
            options: ['Current Assets - Current Liabilities', 'Total Assets - Total Debt', 'Gross Sales - Operating Costs', 'Cash Flow from Operations'],
            correctAnswer: 'Current Assets - Current Liabilities',
            explanation: 'Net Working Capital represents the operational liquidity available to a business (Current Assets minus Current Liabilities).',
            difficulty: 'Easy'
          },
          {
            questionText: 'The weighted average cost of capital (WACC) represents:',
            options: ['The average expected rate of return a company must pay to all its security holders (debt and equity)', 'The marginal cost of short-term bank borrowing', 'The nominal tax rate paid on foreign income', 'The discount rate of US Treasury bills'],
            correctAnswer: 'The average expected rate of return a company must pay to all its security holders (debt and equity)',
            explanation: 'WACC weights cost of equity and after-tax cost of debt according to the firm’s target capital structure.',
            difficulty: 'Medium'
          }
        ]
      }
    ]
  };

  let newCreated = 0;
  for (const [dept, packs] of Object.entries(deptQuestionPacks)) {
    for (const pack of packs) {
      // Find matching category or create link
      const catDoc = await Category.findOne({
        module: { $in: ['Domain', 'Domain Knowledge'] },
        department: dept,
        title: { $regex: new RegExp(pack.category, 'i') }
      });

      for (const q of pack.questions) {
        const existing = await Question.findOne({
          questionText: q.questionText.trim(),
          module: 'Domain'
        });
        if (!existing) {
          await Question.create({
            questionText: q.questionText.trim(),
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty || 'Medium',
            marks: 1,
            module: 'Domain',
            department: dept,
            category: catDoc ? catDoc.title : pack.category,
            categoryId: catDoc ? catDoc._id : null,
            topic: pack.topic,
            status: 'active'
          });
          newCreated++;
        }
      }
    }
  }

  console.log(`[Seed] Seeded ${newCreated} new department-specific questions across all departments.`);

  const finalTotal = await Question.countDocuments({ module: 'Domain' });
  console.log(`[Seed] Total Domain questions in Question Bank now: ${finalTotal}`);

  await mongoose.disconnect();
  console.log('[Seed] Done.');
}

seedDomainQuestionBank().catch(err => {
  console.error(err);
  process.exit(1);
});
