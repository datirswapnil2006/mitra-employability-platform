const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./modules/auth/user.model');
const { Category, Topic } = require('./modules/training/training.models');

const DEPARTMENT_TOPIC_DATA = {
  Mechanical: {
    'Engineering Mechanics': [
      'Statics of Particles & Rigid Bodies',
      'Friction & Moments of Inertia',
      'Kinematics of Particles',
      'Kinetics & Work-Energy Theorem'
    ],
    'Strength of Materials': [
      'Stress-Strain & Hooke\'s Law',
      'Shear Force & Bending Moment Diagrams',
      'Deflection of Beams',
      'Torsion of Circular Shafts'
    ],
    'Thermodynamics': [
      'First & Second Law of Thermodynamics',
      'Carnot & Rankine Cycles',
      'Air Standard Cycles (Otto & Diesel)',
      'Steam Properties & Psychrometry'
    ],
    'Manufacturing Processes': [
      'Metal Casting Fundamentals',
      'Welding & Joining Techniques',
      'Forging & Rolling Operations',
      'Sheet Metal Forming & Drawing'
    ],
    'Fluid Mechanics': [
      'Fluid Properties & Hydrostatic Pressure',
      'Bernoulli\'s Equation & Fluid Dynamics',
      'Laminar vs Turbulent Flow',
      'Boundary Layer & Drag Analysis'
    ],
    'Heat Transfer': [
      'Steady-State Conduction',
      'Free & Forced Convection',
      'Thermal Radiation & View Factors',
      'Heat Exchangers & LMTD Analysis'
    ],
    'CAD & Design': [
      '2D Drafting & Geometric Modeling',
      '3D Parametric Solid Modeling',
      'Assembly Design & Kinematic Constraints',
      'GD&T (Geometric Dimensioning & Tolerancing)'
    ],
    'CNC & Production': [
      'G-Code & M-Code Programming',
      'CNC Milling & Lathe Operations',
      'Lean Manufacturing & 5S Principles',
      'Metrology, Limits, Fits & Tolerances'
    ],
    'Industrial Engineering': [
      'Production Planning & Control (PPC)',
      'Work Study & Motion Economy',
      'Inventory Control Models (EOQ/ABC)',
      'Plant Layout & Operations Research'
    ],
    'Mechanical Core Interview Preparation': [
      'Design of Machine Elements Interview Problems',
      'Thermal & Fluid Engineering Viva Questions',
      'Manufacturing & Production Interview Questions',
      'Core Mechanical Placement Technical Mock'
    ]
  },
  Civil: {
    'Engineering Mechanics': [
      'Equilibrium of Coplanar Forces',
      'Trusses & Frame Analysis',
      'Center of Gravity & Moment of Inertia',
      'Friction & Wedge Analysis'
    ],
    'Strength of Materials': [
      'Axial Stress, Strain & Elastic Constants',
      'Shear Stress & Bending Stress in Beams',
      'Euler\'s Column Theory',
      'Thin & Thick Cylinders'
    ],
    'Structural Engineering': [
      'Determinate vs Indeterminate Structures',
      'Moment Distribution Method',
      'Slope-Deflection Equations',
      'Influence Line Diagrams for Bridges'
    ],
    'Concrete Technology': [
      'Properties of Cement & Hydration',
      'Concrete Mix Design (IS 10262 Standards)',
      'Workability & Mineral Admixtures',
      'Durability, Curing & Quality Control'
    ],
    'Geotechnical Engineering': [
      'Soil Classification & Phase Relations',
      'Permeability, Seepage & Darcy\'s Law',
      'Compaction & Terzaghi Consolidation',
      'Bearing Capacity of Shallow Foundations'
    ],
    'Surveying': [
      'Linear Measurement & Compass Surveying',
      'Leveling, Contouring & Benchmarks',
      'Theodolite Traversing & Total Station',
      'GPS & GIS Principles in Surveying'
    ],
    'Transportation Engineering': [
      'Highway Geometric Design',
      'Flexible vs Rigid Pavement Design',
      'Traffic Volume & Signal Design',
      'Highway Materials & CBR Testing'
    ],
    'Construction Management': [
      'Project Scheduling with CPM & PERT',
      'Construction Equipment Economics',
      'Tendering, Contracts & Arbitration',
      'Site Safety, Quality Audit & RERA Norms'
    ],
    'AutoCAD & Design': [
      'Architectural 2D Floor Plans',
      'Structural Framing & Rebar Detailing',
      'Elevation & Cross-Section Drafting',
      'Building Bye-Laws & Municipal Approvals'
    ],
    'Civil Core Interview Preparation': [
      'Structural Analysis Interview Questions',
      'Site Engineering & Concrete Viva',
      'Geotechnical & Surveying Q&A',
      'Core Civil Placement Technical Mock'
    ]
  },
  'CSE (IOT)': {
    'Programming & DSA': [
      'C/C++ Pointers & Memory Management',
      'Data Structures for Embedded Systems',
      'Linked Lists, Queues & Ring Buffers',
      'Searching, Sorting & Bitwise Algorithms'
    ],
    'OOP': [
      'C++ Object-Oriented Fundamentals',
      'Encapsulation & Hardware Abstraction',
      'Inheritance, Virtual Functions & Polymorphism',
      'Embedded Design Patterns'
    ],
    'DBMS & SQL': [
      'Relational Data Modeling',
      'SQL Queries, Group By & Subqueries',
      'Database Indexing & Normalization',
      'Time-Series Databases for Sensor Data'
    ],
    'Computer Networks': [
      'OSI 7 Layers & TCP/IP Architecture',
      'IP Addressing, Subnetting & Routing',
      'Socket Programming & UDP Streaming',
      'Wireless Protocols (WiFi, BLE, Zigbee)'
    ],
    'IoT Fundamentals': [
      'IoT Reference Architecture & Layers',
      'Edge vs Cloud Computing in IoT',
      'Hardware Platforms (Microcontrollers vs SBCs)',
      'Industrial IoT (IIoT) & Smart Cities'
    ],
    'Sensors & Actuators': [
      'Analog vs Digital Sensors Interfacing',
      'Temperature, Humidity & Pressure Transducers',
      'Actuator Drivers (Relays, Stepper & Servo Motors)',
      'ADC Conversion, Noise Filtering & Calibration'
    ],
    'Embedded Systems': [
      'ARM Cortex-M Architecture & Registers',
      'GPIO Configuration & Interrupt Service Routines (ISR)',
      'Timers, Counters & PWM Generation',
      'Serial Communication Protocols (UART, SPI, I2C)'
    ],
    'Microcontrollers': [
      'Arduino IDE & C++ Firmware Development',
      'ESP32 / ESP8266 WiFi & Bluetooth Programming',
      'Raspberry Pi Linux Setup & GPIO Control',
      'FreeRTOS Real-Time Kernel on Microcontrollers'
    ],
    'Cloud & IoT': [
      'MQTT Publish-Subscribe Protocol & Brokers',
      'CoAP & HTTP REST for IoT Nodes',
      'AWS IoT Core & Azure IoT Hub Integration',
      'Live Sensor Telemetry & Cloud Dashboards'
    ],
    'IoT Technical Interview': [
      'Embedded C & Firmware Interview Questions',
      'Hardware Interfacing & Debugging Viva',
      'IoT Protocols & Security Architecture Q&A',
      'IoT Systems Placement Technical Mock'
    ]
  },
  AIDS: {
    'Programming & DSA': [
      'Python Data Structures (Lists, Tuples, Dicts, Sets)',
      'Algorithmic Complexity & Big-O in Python',
      'Stacks, Queues & Recursion',
      'Searching, Sorting & Hash Maps'
    ],
    'Python Programming': [
      'Advanced Python Syntax & Functional Programming',
      'Object-Oriented Programming in Python',
      'File Handling, JSON & Exception Handling',
      'Virtual Environments & Package Management'
    ],
    'OOP': [
      'Classes, Objects & Dunder Methods',
      'Inheritance, Polymorphism & Metaclasses',
      'Encapsulation & Property Decorators',
      'Design Principles for Data Engineering'
    ],
    'DBMS & SQL': [
      'SQL Basics, Joins & Aggregations',
      'Window Functions & CTEs in SQL',
      'Database Design & Normalization',
      'NoSQL Fundamentals & MongoDB'
    ],
    'Statistics & Probability': [
      'Descriptive Statistics (Mean, Median, Variance, Skewness)',
      'Probability Distributions (Normal, Binomial, Poisson)',
      'Hypothesis Testing, p-Values & Confidence Intervals',
      'Correlation, Covariance & ANOVA'
    ],
    'Machine Learning': [
      'Supervised vs Unsupervised Learning',
      'Linear & Logistic Regression',
      'Decision Trees, Random Forests & Boosting (XGBoost)',
      'Model Evaluation Metrics (ROC-AUC, F1-Score, MSE)'
    ],
    'Data Analysis': [
      'Data Wrangling with Pandas & NumPy',
      'Data Cleaning, Imputation & Feature Engineering',
      'Exploratory Data Analysis (EDA) Techniques',
      'Data Visualization (Matplotlib, Seaborn, Plotly)'
    ],
    'Deep Learning': [
      'Artificial Neural Networks (ANN) & Backpropagation',
      'Convolutional Neural Networks (CNN) for Computer Vision',
      'Recurrent Neural Networks (RNN & LSTM) for Sequences',
      'Optimization (SGD, Adam) & Overfitting Prevention'
    ],
    'Generative AI & LLM Basics': [
      'Transformer Architecture & Self-Attention',
      'Large Language Models (LLM) Foundations',
      'Prompt Engineering, Few-Shot & In-Context Learning',
      'Embeddings, Vector Databases & RAG Architecture'
    ],
    'AI/Data Science Interview': [
      'Machine Learning Algorithm Walkthroughs',
      'Python Coding Challenges for Data Science',
      'Business Problem Solving & Case Study Viva',
      'AI / Data Science Placement Technical Mock'
    ]
  },
  MCA: {
    'Programming & DSA': [
      'Core Java & Object-Oriented DSA',
      'Linear Data Structures (Lists, Stacks, Queues)',
      'Non-Linear Data Structures (Binary Trees, BST, Graphs)',
      'Dynamic Programming & Greedy Algorithms'
    ],
    'OOP': [
      'Java Class Design, Abstract Classes & Interfaces',
      'Polymorphism, Overriding & Overloading',
      'Java Collections Framework (List, Set, Map)',
      'Exception Handling & Multithreading'
    ],
    'DBMS & SQL': [
      'Relational Schema Design & Normalization',
      'Complex SQL Queries, Subqueries & Joins',
      'Indexes, Views & Stored Procedures',
      'Transactions, ACID Properties & Concurrency Control'
    ],
    'Operating Systems': [
      'Process Scheduling Algorithms (FCFS, SJF, Round Robin)',
      'Process Synchronization, Mutex & Semaphores',
      'Virtual Memory, Paging & Page Replacement',
      'Linux Architecture & Shell Scripting'
    ],
    'Computer Networks': [
      'OSI & TCP/IP Protocol Stacks',
      'IP Addressing, CIDR & Subnetting',
      'Transport Protocols (TCP vs UDP, Flow & Error Control)',
      'Application Protocols (HTTP/HTTPS, DNS, FTP)'
    ],
    'Web Development': [
      'HTML5, CSS3 & Responsive Layouts',
      'JavaScript ES6+, Promises & Async/Await',
      'React.js Component Lifecycle & State Management',
      'Node.js & Express RESTful API Development'
    ],
    'Software Engineering': [
      'Software Development Life Cycle (SDLC) Models',
      'Agile Scrum Principles & Sprint Planning',
      'Design Patterns (Singleton, Factory, Observer)',
      'Software Testing (Unit, Integration & System Testing)'
    ],
    'Cloud & DevOps': [
      'Cloud Computing Deployment Models (IaaS, PaaS, SaaS)',
      'Docker Containerization & Dockerfile Best Practices',
      'CI/CD Pipelines with GitHub Actions',
      'Linux Server Configuration & Cloud Deployment'
    ],
    'Application Development': [
      'REST API Design Principles & Status Codes',
      'JWT Authentication & Authorization Middleware',
      'Database Connection Pooling & ORM/ODM Integration',
      'Full-Stack Application Deployment & Monitoring'
    ],
    'Technical Interview Preparation': [
      'Java / Web Full-Stack Coding Questions',
      'Low-Level System Design (LLD) Problems',
      'Database & Architecture Interview Questions',
      'MCA Placement Technical Mock Interview'
    ]
  },
  MBA: {
    'Marketing': [
      'Marketing Management & 4Ps Framework',
      'Segmentation, Targeting & Positioning (STP)',
      'Consumer Decision-Making Process',
      'Brand Equity & Marketing Communication'
    ],
    'Finance': [
      'Financial Statement Analysis (P&L, Balance Sheet, Cash Flow)',
      'Financial Ratios (Liquidity, Solvency, Profitability)',
      'Capital Budgeting Techniques (NPV, IRR, Payback)',
      'Working Capital Management & Cost of Capital (WACC)'
    ],
    'Human Resource Management': [
      'Talent Acquisition, Recruitment & Onboarding',
      'Performance Appraisal Systems & OKRs/KPIs',
      'Organizational Behavior & Leadership Styles',
      'Employee Relations, Compensation & Labor Laws'
    ],
    'Operations Management': [
      'Operations Strategy & Process Analysis',
      'Supply Chain Fundamentals & Logistics',
      'Total Quality Management (TQM) & Six Sigma',
      'Capacity Planning, Facility Location & Layout'
    ],
    'Business Analytics': [
      'Descriptive & Diagnostic Business Analytics',
      'Advanced Excel for Financial & Business Modeling',
      'Tableau & Power BI Dashboards for Business Insights',
      'Data-Driven Managerial Decision Making'
    ],
    'Supply Chain Management': [
      'Supply Chain Network Design & Strategy',
      'Inventory Control Models (EOQ, Safety Stock, JIT)',
      'Procurement, Sourcing & Supplier Relationship Management',
      'Warehousing, Freight Logistics & Distribution'
    ],
    'Digital Marketing': [
      'Search Engine Optimization (SEO) & SEM Strategies',
      'Content Marketing & Social Media Strategy',
      'Performance Marketing, Google Ads & Meta Campaigns',
      'Customer Acquisition Cost (CAC) & Conversion Funnels'
    ],
    'Business Communication': [
      'Executive Presentations & Stakeholder Communication',
      'Business Report & Proposal Writing',
      'Cross-Cultural Business Negotiation Tactics',
      'Crisis Communication & Reputation Management'
    ],
    'Case Study & Business Problems': [
      'Harvard Business School Case Analysis Framework',
      'Profitability & Revenue Growth Frameworks',
      'Market Entry & Competitive Strategy Analysis',
      'Root Cause Analysis & MECE Problem Structuring'
    ],
    'Management Interview Preparation': [
      'Behavioral Interviewing (STAR Method)',
      'Consulting Guesstimates & Market Sizing',
      'Leadership & People Management Scenarios',
      'MBA Campus Placement Technical & HR Mock'
    ]
  },
  IT: {
    'Operating Systems': [
      'Process Lifecycle & Scheduling Algorithms',
      'Deadlock Conditions, Avoidance & Banker\'s Algorithm',
      'Memory Management, Paging & Segmentation',
      'Linux File Permissions & Administration'
    ],
    'Computer Networks': [
      'TCP/IP Protocol Suite & Handshakes',
      'IPv4 & IPv6 Subnetting Calculations',
      'Routing Protocols (OSPF, BGP, RIP)',
      'Network Security, Firewalls & VPNs'
    ],
    'Web Development': [
      'Modern JavaScript ES6+ & Event Loop',
      'React Components, Hooks & State Management',
      'Node.js Server Architecture & Express Routing',
      'Web Security Best Practices (CORS, CSRF, XSS)'
    ],
    'Software Engineering': [
      'Agile Scrum Methodology & Jira Workflows',
      'Object-Oriented Design & SOLID Principles',
      'Version Control with Git & Branching Strategies',
      'Test-Driven Development (TDD) & Unit Testing'
    ],
    'Cloud & DevOps': [
      'Cloud Architecture Fundamentals (AWS/Azure)',
      'Docker Containerization & Image Creation',
      'CI/CD Automation Pipelines',
      'Kubernetes Basics & Container Orchestration'
    ],
    'Technical Interview Preparation': [
      'Data Structures & Algorithms Problem Patterns',
      'Low-Level Object-Oriented System Design',
      'Database Query & Schema Optimization Interview Viva',
      'IT Technical Placement Mock Interview'
    ]
  },
  CSE: {
    'Operating Systems': [
      'OS Kernel Architecture & System Calls',
      'Multithreading, Concurrency & Synchronization',
      'Virtual Memory & Demand Paging Mechanics',
      'Storage Systems, I/O Scheduling & File Systems'
    ],
    'Computer Networks': [
      'Network Routing Algorithms (Dijkstra, Bellman-Ford)',
      'TCP Congestion Control & Flow Mechanics',
      'Application Layer Protocols & Socket Programming',
      'Network Cryptography, TLS/SSL & Certificates'
    ],
    'Web Development': [
      'Full-Stack Architecture & Microservices',
      'REST & GraphQL API Engineering',
      'Frontend Performance Optimization',
      'Database Indexing & Query Profiling'
    ],
    'Software Engineering': [
      'Software Architecture Patterns (MVC, Hexagonal)',
      'Refactoring, Clean Code & Code Review Principles',
      'System Architecture & Scalability Design',
      'Software Verification & Automated Quality Assurance'
    ],
    'Cloud & DevOps': [
      'Cloud Infrastructure Design Patterns',
      'Docker Containers & Multi-Stage Builds',
      'CI/CD Pipeline Design with Automated Testing',
      'Cloud Server Deployment & Monitoring'
    ],
    'Technical Interview Preparation': [
      'LeetCode & High-Yield Placement Problem Patterns',
      'High-Level System Design (HLD) Concepts',
      'Concurrency & Database Architecture Interview Viva',
      'Computer Science Technical Mock Interview'
    ]
  },
  EXTC: {
    'VLSI Design': [
      'CMOS Inverter Characteristics & Switching',
      'Combinational & Sequential MOS Logic Circuits',
      'Verilog HDL Modeling & Simulation Flow',
      'ASIC vs FPGA Design Methodology'
    ],
    'Signals & Systems': [
      'Classification of Continuous & Discrete Signals',
      'Linear Time-Invariant (LTI) Systems & Convolution',
      'Fourier Series & Fourier Transform Analysis',
      'Laplace Transform, Z-Transform & Frequency Response'
    ],
    'Control Systems': [
      'Mathematical Modeling & Transfer Functions',
      'Block Diagram Reduction & Signal Flow Graphs',
      'Time Response Analysis of First & Second Order Systems',
      'Routh-Hurwitz Stability Criterion & Bode Plots'
    ],
    'Core Technical Interview': [
      'Analog & Digital Circuit Design Interview Questions',
      'Microcontroller & Embedded C Technical Viva',
      'Communication Systems & Signal Processing Q&A',
      'EXTC Core Placement Technical Mock'
    ]
  }
};

async function seedAllDomainTopics() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  const admin = await User.findOne({ role: 'admin' });
  const adminId = admin ? admin._id : null;

  let createdCount = 0;
  let skippedCount = 0;

  for (const [dept, categories] of Object.entries(DEPARTMENT_TOPIC_DATA)) {
    for (const [catTitle, topics] of Object.entries(categories)) {
      // Find category
      let cat = await Category.findOne({
        module: { $in: ['Domain', 'Domain Knowledge'] },
        department: dept,
        title: catTitle
      });

      if (!cat) {
        cat = await Category.create({
          module: 'Domain',
          department: dept,
          departmentId: dept,
          title: catTitle,
          description: `Core domain curriculum and interview preparation for ${catTitle}.`,
          order: 1,
          status: 'published',
          createdBy: adminId
        });
        console.log(`Created missing category: [${dept}] - ${catTitle}`);
      }

      for (let i = 0; i < topics.length; i++) {
        const topTitle = topics[i];
        const existing = await Topic.findOne({
          module: { $in: ['Domain', 'Domain Knowledge'] },
          department: dept,
          categoryId: cat._id,
          title: topTitle
        });

        if (!existing) {
          await Topic.create({
            module: 'Domain',
            department: dept,
            departmentId: dept,
            categoryId: cat._id,
            category: catTitle,
            title: topTitle,
            description: `Core placement curriculum, concept mastery, and interview questions for ${topTitle}.`,
            order: i + 1,
            status: 'published',
            createdBy: adminId
          });
          createdCount++;
        } else {
          skippedCount++;
        }
      }
    }
  }

  console.log(`\n=== Seeding Finished ===`);
  console.log(`Created: ${createdCount} topics`);
  console.log(`Skipped existing: ${skippedCount} topics`);

  // Print summary by department
  const summary = await Topic.aggregate([
    { $match: { module: { $in: ['Domain', 'Domain Knowledge'] } } },
    { $group: { _id: '$department', count: { $sum: 1 } } }
  ]);
  if (require.main === module) {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seedAllDomainTopics().catch(console.error);
}

module.exports = seedAllDomainTopics;

