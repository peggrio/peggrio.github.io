export const profile = {
  monogram: 'PL Inspolab',
  name: 'Peizhen Liao',
  role: 'Software Engineer',
  specialization: 'Full Stack / Site Reliability Engineering',
  techStack: ['AWS', 'Kubernetes', 'Databricks', 'Microservices'],
  currentWork: {
    organization: 'Machflow Inc. · Pomo.ai',
    summary: 'Building Databricks Lakehouse pipelines for 10K+ daily records and orchestrating 10+ production AI agents through reusable MCP tools and shared workspaces.',
  },
  undergraduate: {
    introduction: 'During undergrad, I studied Applied Chemistry and Computer Science as a dual degree. That’s when I discovered my interest in computational chemistry and mathematical modeling.',
    work: [
      {
        type: 'Research article',
        title: 'Sustainable metal-lignosulfonate catalyst for efficient catalytic transfer hydrogenation of levulinic acid to γ-valerolactone',
        href: 'https://www.sciencedirect.com/science/article/abs/pii/S0926860X22000795',
      },
      {
        type: 'Research article',
        title: 'Molecular AND logic gate for multiple single-nucleotide mutations detection based on CRISPR/Cas9n system-triggered signal amplification',
        href: 'https://www.sciencedirect.com/science/article/abs/pii/S0003267020303792',
      },
      {
        type: 'Undergraduate thesis',
        title: 'Molecular Dynamics Simulation of Trypsin Denaturation under Ultrahigh Pressure',
        description: 'Studied surimi structural changes under different pressure conditions through molecular dynamics simulation and examined protein denaturation. Protein modeling was performed with GROMACS, then analyzed and visualized with PyMOL and VMD.',
      },
      {
        type: 'Mathematical modeling · National Second Prize',
        title: 'Study on the Temperature Profile and Conveyor Belt Speed of a Reflow Oven',
        description: '2020 China Undergraduate Mathematical Contest in Modeling (CUMCM)',
        href: 'https://www.contest.comap.com/undergraduate/contests/mcm/contests/2020/results/',
      },
    ],
  },
  graduate: {
    university: 'Northeastern University',
    degree: 'Master of Science',
    program: 'Software Engineering Systems',
    graduated: 'December 2024',
    date: '2024-12',
    courses: ['Data Structures and Algorithms', 'Computer Networks', 'Advanced Cloud Computing', 'Web Design', 'User Experience Engineering'],
    teachingAssistant: {
      period: 'Sep 2024 — Dec 2024',
      location: 'Boston, MA',
      course: 'CSYE 7380 · Theory & Practical Applications of AI Generative Modeling',
      description: 'Built a RAG-based chatbot with React and Node.js, using a Pinecone vector index for semantic similarity search. It served as a course demonstration for 50+ students studying applied generative AI.',
    },
  },
  experience: [
    {
      id: '01',
      period: 'Sep 2025 — Present',
      title: 'Software Engineer',
      organization: 'Machflow Inc. · Pomo.ai',
      location: 'Palo Alto, CA',
      description: 'Built 99%+ reliable Databricks pipelines for 10K+ daily records and semantic search over 50K+ profiles. Shared MCP tools cut integration time by 30% across 10+ AI agents.',
    },
    {
      id: '02',
      period: 'Mar 2025 — Aug 2025',
      title: 'Founding Software Engineer',
      organization: 'Panoverse Inc. · Kolect.ai',
      location: 'Cambridge, MA',
      description: 'Built Java and Spring Boot microservices serving 5K+ daily requests. Added event-driven processing, rate limiting, retries, monitoring, and resilient third-party synchronization.',
    },
    {
      id: '03',
      period: 'Jun 2023 — Jan 2024',
      title: 'Backend & Cloud Infrastructure Software Engineer Intern',
      organization: 'Factorial Energy',
      location: 'Billerica, MA',
      description: 'Built an AWS and Terraform serverless HR–IT sync, saving about 10 manual hours weekly. Delivered a paperless GraphQL and DynamoDB production system with EC2-based UI automation.',
    },
  ],
  email: '',
};
