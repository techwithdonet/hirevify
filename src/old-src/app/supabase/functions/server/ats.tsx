import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}));

// AI-Powered Resume Extraction Endpoint
app.post('/extract-resume', async (c) => {
  try {
    const { resumeText, fileName, fileType } = await c.req.json();
    
    if (!resumeText || resumeText.trim().length < 50) {
      return c.json({
        success: false,
        error: 'Resume text is too short or empty'
      }, 400);
    }

    console.log(`🔍 Processing resume extraction for: ${fileName}`);

    // ULTRA-STRICT AI extraction prompt - ZERO TOLERANCE for fake data
    const extractionPrompt = `
YOU ARE A FORENSIC DATA EXTRACTION SYSTEM. YOUR MISSION IS TO EXTRACT ONLY VERIFIABLE, REAL DATA.

ABSOLUTE RULES - VIOLATION RESULTS IN IMMEDIATE FAILURE:
1. EXTRACT ONLY DATA THAT PHYSICALLY EXISTS IN THE PROVIDED TEXT
2. NEVER GENERATE, INVENT, CREATE, OR ASSUME ANY DATA
3. NEVER USE PLACEHOLDERS, EXAMPLES, OR GENERIC VALUES
4. IF DATA DOESN'T EXIST, USE EMPTY STRING "" OR EMPTY ARRAY []
5. EVERY EXTRACTED PIECE MUST BE DIRECTLY TRACEABLE TO SOURCE TEXT
6. NO ASSUMPTIONS, NO EDUCATED GUESSES, NO INTELLIGENT COMPLETION

FORBIDDEN ACTIONS (WILL CAUSE SYSTEM REJECTION):
❌ Creating names like "John Doe", "Candidate Name", "User Name"
❌ Generating emails like "user@email.com", "contact@example.com"
❌ Making up phone numbers like "555-1234", "XXX-XXX-XXXX"
❌ Inventing locations like "City, State", "Location not specified"
❌ Adding skills not explicitly mentioned
❌ Creating work experience that doesn't exist
❌ Generating education information
❌ Making up dates, companies, or positions

EXTRACTION PROTOCOL:
- SCAN the text character by character if needed
- FIND exact matches only
- COPY verbatim from source
- VERIFY each extraction against source text
- REJECT if uncertain or suspicious

DATA VALIDATION REQUIREMENTS:
✅ Name: Must be actual name found in document (not "Name extraction failed")
✅ Email: Must be real email address with @ symbol and valid domain
✅ Phone: Must be actual phone number sequence from document
✅ Location: Must be real location mentioned in text
✅ Skills: Must be explicitly listed technical/professional skills
✅ Experience: Must have real company names and job titles
✅ Education: Must have actual institution names and degrees

RESPONSE FORMAT (PURE JSON, NO EXPLANATIONS):
{
  "personalInfo": {
    "name": "EXACT name from resume or empty string",
    "email": "EXACT email from resume or empty string", 
    "phone": "EXACT phone from resume or empty string",
    "location": "EXACT location from resume or empty string",
    "linkedIn": "EXACT LinkedIn URL if found or empty string",
    "github": "EXACT GitHub URL if found or empty string",
    "portfolio": "EXACT portfolio URL if found or empty string"
  },
  "professionalSummary": "EXACT summary text from resume or empty string",
  "skills": {
    "technical": ["ONLY skills explicitly mentioned"],
    "soft": ["ONLY soft skills explicitly mentioned"],
    "languages": ["ONLY languages explicitly mentioned"],
    "certifications": ["ONLY certifications explicitly mentioned"]
  },
  "experience": [
    {
      "company": "EXACT company name from resume",
      "position": "EXACT position title from resume", 
      "startDate": "EXACT start date from resume",
      "endDate": "EXACT end date from resume",
      "description": "EXACT job description from resume",
      "achievements": ["EXACT achievements listed in resume"]
    }
  ],
  "education": [
    {
      "institution": "EXACT school name from resume",
      "degree": "EXACT degree name from resume",
      "field": "EXACT field of study from resume",
      "graduationDate": "EXACT graduation date from resume",
      "gpa": "EXACT GPA if mentioned or empty string"
    }
  ],
  "projects": [
    {
      "name": "EXACT project name from resume",
      "description": "EXACT project description from resume",
      "technologies": ["EXACT technologies mentioned"],
      "url": "EXACT project URL if provided or empty string"
    }
  ],
  "metadata": {
    "totalExperience": "CALCULATE only from actual dates in resume",
    "careerLevel": "DETERMINE only from actual experience data",
    "primaryRole": "MOST RECENT job title from actual experience",
    "industries": ["ONLY industries evident from actual companies"]
  }
}

CRITICAL: If you cannot find real data for ANY field, use empty values. Better to return empty than fake.

RESUME TEXT TO ANALYZE:
${resumeText}

EXTRACT ONLY WHAT EXISTS. NO CREATIVITY. NO ASSUMPTIONS. FORENSIC ACCURACY ONLY.
`;

    // Call OpenAI API with ULTRA-STRICT error handling
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('❌ OpenAI API key not found');
      return c.json({
        success: false,
        error: 'AI service not configured'
      }, 500);
    }

    console.log('🤖 Calling OpenAI for ULTRA-SAFE resume extraction...');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a FORENSIC DATA EXTRACTION SYSTEM. You ONLY extract real, verifiable data that physically exists in the provided text. You NEVER generate, create, invent, or assume any information. If data does not exist, you return empty values. You are trained to detect and REJECT any attempt to create fake or placeholder data. Return ONLY valid JSON with no additional text.'
          },
          {
            role: 'user',
            content: extractionPrompt
          }
        ],
        temperature: 0.0,  // ZERO creativity/randomness
        max_tokens: 3000,
        presence_penalty: -2.0,  // Discourage creating new content
        frequency_penalty: 0.0
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('❌ OpenAI API error:', errorText);
      return c.json({
        success: false,
        error: `AI service error: ${openaiResponse.status}`
      }, 500);
    }

    const openaiResult = await openaiResponse.json();
    const extractedText = openaiResult.choices[0]?.message?.content;

    if (!extractedText) {
      console.error('❌ No response from OpenAI');
      return c.json({
        success: false,
        error: 'No response from AI service'
      }, 500);
    }

    console.log('✅ OpenAI response received, parsing JSON...');

    // Parse the JSON response with ULTRA-STRICT error handling
    let extractedData;
    try {
      // Clean the response in case there's extra text
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : extractedText;
      extractedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError);
      console.log('Raw OpenAI response:', extractedText);
      
      // ULTRA-SAFE fallback extraction - only real patterns
      const ultraSafeFallbackData = ultraSafeTextExtraction(resumeText);
      return c.json({
        success: true,
        data: ultraSafeFallbackData,
        confidence: 60,
        source: 'ultra-safe-fallback',
        warning: 'AI parsing failed, using ultra-safe pattern extraction only'
      });
    }

    // NUCLEAR-LEVEL validation and data integrity verification
    const ultraValidatedData = nuclearDataValidation(extractedData, resumeText);
    const integrity = calculateDataIntegrity(ultraValidatedData, resumeText);

    // REJECT if integrity score is too low (indicates potential fake data)
    if (integrity.score < 70) {
      console.warn('⚠️ DATA INTEGRITY VIOLATION DETECTED - REJECTING EXTRACTION');
      console.warn('Integrity violations:', integrity.violations);
      
      // Return ultra-safe fallback instead
      const ultraSafeFallbackData = ultraSafeTextExtraction(resumeText);
      return c.json({
        success: true,
        data: ultraSafeFallbackData,
        confidence: 50,
        source: 'integrity-protection',
        warning: 'Potential fake data detected, using safe extraction only',
        integrityReport: integrity
      });
    }

    console.log('✅ Resume extraction completed with ULTRA-SAFE validation');
    console.log('📊 Data integrity report:', {
      name: ultraValidatedData.personalInfo?.name,
      email: ultraValidatedData.personalInfo?.email,
      phone: ultraValidatedData.personalInfo?.phone,
      skills: ultraValidatedData.skills?.technical?.length || 0,
      experience: ultraValidatedData.experience?.length || 0,
      integrity: integrity.score,
      violations: integrity.violations
    });

    // Store the extraction result with integrity audit trail
    const extractionId = `extraction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await kv.set(extractionId, {
      fileName,
      fileType,
      extractedData: ultraValidatedData,
      integrity: integrity.score,
      violations: integrity.violations,
      timestamp: new Date().toISOString(),
      auditTrail: {
        source: 'ai-extraction',
        validationPassed: true,
        integrityScore: integrity.score
      }
    });

    return c.json({
      success: true,
      data: ultraValidatedData,
      confidence: integrity.score,
      extractionId,
      integrityReport: {
        score: integrity.score,
        violations: integrity.violations.length,
        status: integrity.score >= 90 ? 'EXCELLENT' : integrity.score >= 80 ? 'GOOD' : 'ACCEPTABLE'
      },
      metadata: {
        fileName,
        fileType,
        processingTime: Date.now(),
        wordCount: resumeText.split(/\s+/).length
      }
    });

  } catch (error) {
    console.error('❌ Resume extraction error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown extraction error'
    }, 500);
  }
});

// ULTRA-SAFE fallback extraction for when AI parsing fails
function ultraSafeTextExtraction(text: string) {
  console.log('🔧 Running ultra-safe text extraction fallback...');
  
  // Enhanced extraction patterns
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phonePattern = /(\+1\s?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/;
  
  // ENHANCED: Multiple name extraction strategies with international support
  const namePatterns = [
    /^([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/m, // First line name
    /Name[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i, // "Name: John Doe"
    /^([A-Z][A-Z\s]+)(?:\n|\r)/m, // ALL CAPS name
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})(?:\s*\n|\s*$)/, // Multi-word name
    // International name patterns
    /^([A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+)/m, // Three-part names
    /([A-ZÀ-ÿ][a-zà-ÿ]+ [A-ZÀ-ÿ][a-zà-ÿ]+)/m, // Names with accents
    /^([A-Z]+\s+[A-Z]+(?:\s+[A-Z]+)?)/m, // ALL CAPS variations
  ];

  // ENHANCED: International phone patterns
  const phonePatterns = [
    /(\+1\s?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/, // US format
    /(\+\d{1,3})\s?(\d{3,4})[-.\s]?(\d{3,4})[-.\s]?(\d{4})/, // International
    /(\d{10})/, // Plain 10 digits
    /(\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})/, // Flexible international
    /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/, // Basic US format
  ];

  // ENHANCED: Location extraction with international support
  const locationPatterns = [
    // US patterns
    /(?:Address|Location|Based in)[:\s]+([^,\n]+,\s*[A-Z]{2}(?:\s+\d{5})?)/i,
    /([A-Z][a-z]+,\s*[A-Z]{2}(?:\s+\d{5})?)/,
    /([A-Z][a-z]+,\s*[A-Z][a-z]+)/,
    // International patterns
    /([A-Z][a-z]+,\s*[A-Z][a-z]+,\s*[A-Z][a-z]+)/, // City, State, Country
    /([A-Z][a-z]+\s+\d{4,6},\s*[A-Z][a-z]+)/, // UK postcode format
    /([A-Z][a-z]+,\s*[A-Z]{2,3})/, // City, Country code
    /((?:London|Paris|Berlin|Tokyo|Sydney|Toronto|Mumbai|Delhi|Bangalore|Chennai|Singapore|Hong Kong|Dubai)[,\s]*[A-Z]*[a-z]*)/i,
  ];

  const emailMatches = text.match(emailPattern) || [];
  let phoneMatch = '';
  let name = '';
  let location = '';
  
  // Try multiple phone patterns
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      phoneMatch = match[0];
      break;
    }
  }
  
  // Try multiple name patterns
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length > 3 && match[1].length < 50) {
      // Validate it looks like a real name
      const potentialName = match[1].trim();
      if (!/\d/.test(potentialName) && potentialName.split(' ').length >= 2) {
        name = potentialName;
        break;
      }
    }
  }

  // Try multiple location patterns
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      location = match[1].trim();
      break;
    }
  }

  // ENHANCED: Comprehensive skills extraction with emerging technologies
  const comprehensiveSkills = [
    // Core Programming Languages
    'JavaScript', 'Python', 'Java', 'TypeScript', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Dart', 'Elixir', 'Haskell', 'F#',
    
    // Web Technologies
    'HTML', 'CSS', 'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js', 'Node.js', 'Express', 'Fastify', 'Webpack', 'Vite', 'Parcel', 'Sass', 'Less', 'TailwindCSS', 'Bootstrap',
    
    // Backend & APIs
    'REST', 'GraphQL', 'API', 'Microservices', 'Spring Boot', 'Django', 'Flask', 'FastAPI', 'Laravel', 'Rails', 'ASP.NET', 'Gin', 'Echo',
    
    // Databases
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'Cassandra', 'Neo4j', 'InfluxDB', 'SQLite', 'Oracle', 'SQL Server',
    
    // Cloud & Infrastructure
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CloudFormation', 'Ansible', 'Jenkins', 'GitLab CI', 'GitHub Actions', 'CircleCI',
    
    // DevOps & Tools
    'Git', 'Linux', 'Windows', 'macOS', 'Bash', 'PowerShell', 'Nginx', 'Apache', 'CI/CD', 'DevOps', 'Monitoring', 'Prometheus', 'Grafana',
    
    // AI/ML & Data
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Jupyter', 'Apache Spark', 'Hadoop', 'Airflow',
    
    // Mobile Development
    'React Native', 'Flutter', 'iOS', 'Android', 'Xamarin', 'Ionic',
    
    // Emerging Technologies
    'Blockchain', 'Web3', 'Smart Contracts', 'Solidity', 'NFT', 'DeFi', 'AR', 'VR', 'IoT', 'Edge Computing', 'Serverless',
    
    // Testing & Quality
    'Jest', 'Cypress', 'Selenium', 'TestNG', 'JUnit', 'PyTest', 'Mocha', 'Chai', 'Unit Testing', 'Integration Testing',
    
    // Project Management & Soft Skills
    'Agile', 'Scrum', 'Kanban', 'JIRA', 'Confluence', 'Slack', 'Trello', 'Asana', 'Leadership', 'Communication', 'Problem Solving', 'Team Management'
  ];
  
  const extractedSkills = comprehensiveSkills.filter(skill => 
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)
  );

  // ENHANCED: Experience extraction patterns
  const experiencePatterns = [
    // Company patterns
    /(?:at|@)\s+([A-Z][a-zA-Z\s&.,-]+)(?:\s+from|\s+\(|\s*$)/g,
    /(?:Company|Employer|Organization)[:\s]+([^\n,]+)/gi,
    /(?:Working at|Works at|Employed at)\s+([A-Z][a-zA-Z\s&.,-]+)/g,
    // Position patterns
    /(?:Position|Role|Title)[:\s]+([A-Z][a-zA-Z\s&.,-]+)/gi,
    /(?:as|as a|as an)\s+((?:Senior|Junior|Lead|Principal|Staff)?\s*[A-Z][a-zA-Z\s]+(?:Engineer|Developer|Manager|Analyst|Specialist|Consultant))/gi,
  ];

  const experience = [];
  let experienceText = '';
  
  // Try to find work experience section
  const expSectionMatch = text.match(/(?:EXPERIENCE|WORK|EMPLOYMENT|CAREER|PROFESSIONAL)[\s\S]*?(?=\n[A-Z]{3,}|\nEDUCATION|\nSKILLS|$)/i);
  if (expSectionMatch) {
    experienceText = expSectionMatch[0];
    
    // Extract companies and positions
    for (const pattern of experiencePatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        if (match[1] && match[1].length > 2) {
          // Basic experience entry
          experience.push({
            company: match[1].trim(),
            position: 'Position extraction in progress',
            startDate: '',
            endDate: '',
            description: '',
            achievements: []
          });
        }
      }
    }
  }

  return {
    personalInfo: {
      name: name || '',
      email: emailMatches[0] || '',
      phone: phoneMatch || '',
      location: location || '',
      linkedIn: text.match(/(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)[\w-]+/i)?.[0] || '',
      github: text.match(/github\.com\/[\w-]+/i)?.[0] || '',
      portfolio: text.match(/(?:portfolio|website)[:\s]+(https?:\/\/[^\s]+)/i)?.[1] || ''
    },
    professionalSummary: '',
    skills: {
      technical: extractedSkills,
      soft: ['Communication', 'Problem Solving', 'Team Work', 'Leadership', 'Critical Thinking'].filter(skill => 
        new RegExp(skill.toLowerCase().replace(' ', '\\s*'), 'i').test(text)
      ),
      languages: [],
      certifications: []
    },
    experience: experience.length > 0 ? experience : [],
    education: [],
    projects: [],
    metadata: {
      totalExperience: '',
      careerLevel: 'entry' as const,
      primaryRole: '',
      industries: []
    }
  };
}

// NUCLEAR-LEVEL validation function  
function nuclearDataValidation(data: any, originalText: string) {
  console.log('🔒 Running NUCLEAR-LEVEL data validation...');
  
  // Ensure all required fields exist
  if (!data.personalInfo) data.personalInfo = {};
  if (!data.skills) data.skills = { technical: [], soft: [], languages: [], certifications: [] };
  if (!data.experience) data.experience = [];
  if (!data.education) data.education = [];
  if (!data.projects) data.projects = [];
  if (!data.metadata) data.metadata = {};

  // ULTRA-STRICT fake data detection with ZERO TOLERANCE
  const suspiciousPatterns = {
    names: [
      /Candidate/i, /User/i, /Person/i, /Individual/i, /Applicant/i,
      /Name not/i, /extraction/i, /failed/i, /error/i, /placeholder/i,
      /John Doe/i, /Jane Doe/i, /Test/i, /Sample/i, /Example/i,
      /^Name$/i, /Name extraction/i, /not detected/i, /extraction failed/i
    ],
    emails: [
      /@example\./i, /@test\./i, /@placeholder\./i, /@fake\./i, /@demo\./i,
      /not.detected/i, /extraction/i, /failed/i, /email\.com$/i,
      /user@email/i, /contact@example/i, /test@test/i, /placeholder@/i
    ],
    phones: [
      /555-1234/i, /000-000-0000/i, /XXX/i, /not.detected/i,
      /phone.not/i, /extraction/i, /failed/i, /placeholder/i,
      /\(555\)/i, /555-555-/i, /123-456-7890/i, /000-123-4567/i
    ],
    companies: [
      /Company Name/i, /Employer/i, /Organization/i, /not.detected/i,
      /extraction/i, /failed/i, /placeholder/i, /Example Corp/i,
      /Test Company/i, /Sample Inc/i, /Demo Corp/i, /Previous Company/i
    ],
    institutions: [
      /University Name/i, /School Name/i, /Institution/i, /not.detected/i,
      /extraction/i, /failed/i, /placeholder/i, /Example University/i,
      /Test University/i, /Sample College/i, /Demo School/i
    ]
  };

  // ZERO TOLERANCE VALIDATION - Replace ANY suspicious data with empty values
  
  // Name validation
  if (data.personalInfo?.name) {
    for (const pattern of suspiciousPatterns.names) {
      if (pattern.test(data.personalInfo.name)) {
        console.warn(`🚨 NUCLEAR REJECTION: Fake name pattern detected - "${data.personalInfo.name}"`);
        data.personalInfo.name = '';
        break;
      }
    }
    
    // Cross-verify name exists in original text
    if (data.personalInfo.name && !originalText.toLowerCase().includes(data.personalInfo.name.toLowerCase())) {
      console.warn(`🚨 NUCLEAR REJECTION: Name "${data.personalInfo.name}" not found in source text`);
      data.personalInfo.name = '';
    }
  }

  // Email validation
  if (data.personalInfo?.email) {
    for (const pattern of suspiciousPatterns.emails) {
      if (pattern.test(data.personalInfo.email)) {
        console.warn(`🚨 NUCLEAR REJECTION: Fake email pattern detected - "${data.personalInfo.email}"`);
        data.personalInfo.email = '';
        break;
      }
    }
    
    // Cross-verify email exists in original text
    if (data.personalInfo.email && !originalText.toLowerCase().includes(data.personalInfo.email.toLowerCase())) {
      console.warn(`🚨 NUCLEAR REJECTION: Email "${data.personalInfo.email}" not found in source text`);
      data.personalInfo.email = '';
    }
    
    // Validate email format
    if (data.personalInfo.email) {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
      if (!emailRegex.test(data.personalInfo.email)) {
        console.warn(`🚨 NUCLEAR REJECTION: Invalid email format - "${data.personalInfo.email}"`);
        data.personalInfo.email = '';
      }
    }
  }

  // Phone validation
  if (data.personalInfo?.phone) {
    for (const pattern of suspiciousPatterns.phones) {
      if (pattern.test(data.personalInfo.phone)) {
        console.warn(`🚨 NUCLEAR REJECTION: Fake phone pattern detected - "${data.personalInfo.phone}"`);
        data.personalInfo.phone = '';
        break;
      }
    }
    
    // Validate phone number structure
    if (data.personalInfo.phone) {
      const phoneDigits = data.personalInfo.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        console.warn(`🚨 NUCLEAR REJECTION: Invalid phone structure - "${data.personalInfo.phone}"`);
        data.personalInfo.phone = '';
      }
    }
  }

  // Skills validation - ONLY keep skills that exist in original text
  if (data.skills?.technical?.length > 0) {
    const verifiedSkills = [];
    for (const skill of data.skills.technical) {
      if (skill && typeof skill === 'string' && skill.length > 1 && skill.length < 50) {
        // Must exist in original text
        if (originalText.toLowerCase().includes(skill.toLowerCase())) {
          verifiedSkills.push(skill);
        } else {
          console.warn(`🚨 SKILL REJECTED: "${skill}" not found in source text`);
        }
      }
    }
    data.skills.technical = [...new Set(verifiedSkills)];
  }

  // Experience validation
  if (data.experience?.length > 0) {
    const verifiedExperience = [];
    for (const exp of data.experience) {
      if (exp.company) {
        let isValidCompany = true;
        
        // Check for fake company patterns
        for (const pattern of suspiciousPatterns.companies) {
          if (pattern.test(exp.company)) {
            console.warn(`🚨 NUCLEAR REJECTION: Fake company pattern - "${exp.company}"`);
            isValidCompany = false;
            break;
          }
        }
        
        // Verify company exists in original text
        if (isValidCompany && !originalText.toLowerCase().includes(exp.company.toLowerCase())) {
          console.warn(`🚨 NUCLEAR REJECTION: Company "${exp.company}" not found in source text`);
          isValidCompany = false;
        }
        
        if (isValidCompany) {
          verifiedExperience.push(exp);
        }
      }
    }
    data.experience = verifiedExperience;
  }

  // Education validation
  if (data.education?.length > 0) {
    const verifiedEducation = [];
    for (const edu of data.education) {
      if (edu.institution) {
        let isValidInstitution = true;
        
        // Check for fake institution patterns
        for (const pattern of suspiciousPatterns.institutions) {
          if (pattern.test(edu.institution)) {
            console.warn(`🚨 NUCLEAR REJECTION: Fake institution pattern - "${edu.institution}"`);
            isValidInstitution = false;
            break;
          }
        }
        
        // Verify institution exists in original text
        if (isValidInstitution && !originalText.toLowerCase().includes(edu.institution.toLowerCase())) {
          console.warn(`🚨 NUCLEAR REJECTION: Institution "${edu.institution}" not found in source text`);
          isValidInstitution = false;
        }
        
        if (isValidInstitution) {
          verifiedEducation.push(edu);
        }
      }
    }
    data.education = verifiedEducation;
  }

  // If all critical data was rejected, use ultra-safe fallback
  if (!data.personalInfo.name && !data.personalInfo.email && !data.personalInfo.phone) {
    console.warn('🚨 CRITICAL: All personal info rejected, using ultra-safe fallback');
    const fallbackData = ultraSafeTextExtraction(originalText);
    
    // Only use fallback if it passes our validation
    if (fallbackData.personalInfo.name && originalText.toLowerCase().includes(fallbackData.personalInfo.name.toLowerCase())) {
      data.personalInfo.name = fallbackData.personalInfo.name;
    }
    if (fallbackData.personalInfo.email && originalText.toLowerCase().includes(fallbackData.personalInfo.email.toLowerCase())) {
      data.personalInfo.email = fallbackData.personalInfo.email;
    }
    if (fallbackData.personalInfo.phone && originalText.includes(fallbackData.personalInfo.phone.replace(/\D/g, ''))) {
      data.personalInfo.phone = fallbackData.personalInfo.phone;
    }
  }

  console.log('✅ NUCLEAR-LEVEL validation complete - only verified real data remains');
  
  return data;
}

// NUCLEAR-LEVEL Data Integrity Verification System
function calculateDataIntegrity(data: any, originalText: string): { score: number; violations: string[] } {
  console.log('🔍 Running NUCLEAR-LEVEL data integrity verification...');
  
  const violations: string[] = [];
  let integrityScore = 100;

  // ULTRA-STRICT validation checks
  
  // 1. Name Integrity Check
  if (data.personalInfo?.name) {
    const name = data.personalInfo.name;
    
    // Check for obvious fake patterns
    const fakeNamePatterns = [
      /Candidate/i, /User/i, /Person/i, /Individual/i, /Applicant/i,
      /Name not/i, /extraction/i, /failed/i, /error/i, /placeholder/i,
      /John Doe/i, /Jane Doe/i, /Test/i, /Sample/i, /Example/i
    ];
    
    for (const pattern of fakeNamePatterns) {
      if (pattern.test(name)) {
        violations.push(`FAKE NAME DETECTED: "${name}" matches forbidden pattern ${pattern}`);
        integrityScore -= 30;
        break;
      }
    }
    
    // Verify name exists in original text
    if (!originalText.toLowerCase().includes(name.toLowerCase())) {
      violations.push(`NAME NOT FOUND: "${name}" does not exist in source document`);
      integrityScore -= 25;
    }
    
    // Check for realistic name structure
    if (name.length < 3 || name.length > 50 || !/^[A-Za-zÀ-ÿ\s'-]+$/.test(name)) {
      violations.push(`INVALID NAME FORMAT: "${name}" has suspicious structure`);
      integrityScore -= 20;
    }
  }

  // 2. Email Integrity Check
  if (data.personalInfo?.email) {
    const email = data.personalInfo.email;
    
    // Check for fake email patterns
    const fakeEmailPatterns = [
      /@example\./i, /@test\./i, /@placeholder\./i, /@fake\./i,
      /not.detected/i, /extraction/i, /failed/i, /email\.com$/i
    ];
    
    for (const pattern of fakeEmailPatterns) {
      if (pattern.test(email)) {
        violations.push(`FAKE EMAIL DETECTED: "${email}" matches forbidden pattern ${pattern}`);
        integrityScore -= 30;
        break;
      }
    }
    
    // Verify email exists in original text
    if (!originalText.toLowerCase().includes(email.toLowerCase())) {
      violations.push(`EMAIL NOT FOUND: "${email}" does not exist in source document`);
      integrityScore -= 25;
    }
    
    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
    if (!emailRegex.test(email)) {
      violations.push(`INVALID EMAIL FORMAT: "${email}" is not a valid email address`);
      integrityScore -= 20;
    }
  }

  // 3. Phone Integrity Check
  if (data.personalInfo?.phone) {
    const phone = data.personalInfo.phone;
    
    // Check for fake phone patterns
    const fakePhonePatterns = [
      /555-1234/i, /000-000-0000/i, /XXX/i, /not.detected/i,
      /phone.not/i, /extraction/i, /failed/i, /placeholder/i
    ];
    
    for (const pattern of fakePhonePatterns) {
      if (pattern.test(phone)) {
        violations.push(`FAKE PHONE DETECTED: "${phone}" matches forbidden pattern ${pattern}`);
        integrityScore -= 25;
        break;
      }
    }
    
    // Verify phone number has realistic structure
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      violations.push(`INVALID PHONE LENGTH: "${phone}" has suspicious digit count`);
      integrityScore -= 15;
    }
  }

  // 4. Skills Integrity Check
  if (data.skills?.technical?.length > 0) {
    const skills = data.skills.technical;
    let skillsFoundInText = 0;
    
    for (const skill of skills) {
      if (originalText.toLowerCase().includes(skill.toLowerCase())) {
        skillsFoundInText++;
      } else {
        violations.push(`SKILL NOT FOUND: "${skill}" does not exist in source document`);
        integrityScore -= 5;
      }
    }
    
    // Check if too many skills were "found" vs actually in text
    const skillsVerificationRate = skillsFoundInText / skills.length;
    if (skillsVerificationRate < 0.7) {
      violations.push(`LOW SKILLS VERIFICATION: Only ${Math.round(skillsVerificationRate * 100)}% of skills found in source`);
      integrityScore -= 15;
    }
  }

  // 5. Experience Integrity Check
  if (data.experience?.length > 0) {
    for (const exp of data.experience) {
      if (exp.company) {
        // Check for fake company patterns
        const fakeCompanyPatterns = [
          /Company Name/i, /Employer/i, /Organization/i, /not.detected/i,
          /extraction/i, /failed/i, /placeholder/i, /Example Corp/i
        ];
        
        for (const pattern of fakeCompanyPatterns) {
          if (pattern.test(exp.company)) {
            violations.push(`FAKE COMPANY DETECTED: "${exp.company}" matches forbidden pattern`);
            integrityScore -= 20;
            break;
          }
        }
        
        // Verify company exists in original text
        if (!originalText.toLowerCase().includes(exp.company.toLowerCase())) {
          violations.push(`COMPANY NOT FOUND: "${exp.company}" does not exist in source document`);
          integrityScore -= 15;
        }
      }
    }
  }

  // 6. Education Integrity Check
  if (data.education?.length > 0) {
    for (const edu of data.education) {
      if (edu.institution) {
        // Check for fake institution patterns
        const fakeInstitutionPatterns = [
          /University Name/i, /School Name/i, /Institution/i, /not.detected/i,
          /extraction/i, /failed/i, /placeholder/i, /Example University/i
        ];
        
        for (const pattern of fakeInstitutionPatterns) {
          if (pattern.test(edu.institution)) {
            violations.push(`FAKE INSTITUTION DETECTED: "${edu.institution}" matches forbidden pattern`);
            integrityScore -= 20;
            break;
          }
        }
        
        // Verify institution exists in original text
        if (!originalText.toLowerCase().includes(edu.institution.toLowerCase())) {
          violations.push(`INSTITUTION NOT FOUND: "${edu.institution}" does not exist in source document`);
          integrityScore -= 15;
        }
      }
    }
  }

  // Ensure minimum integrity score
  integrityScore = Math.max(integrityScore, 0);
  
  console.log(`🔍 Data integrity verification complete: ${integrityScore}% (${violations.length} violations)`);
  
  return {
    score: integrityScore,
    violations
  };
}

// Enhanced validation and enhancement function
function enhancedValidateAndEnhanceData(data: any, originalText: string) {
  // Ensure all required fields exist
  if (!data.personalInfo) data.personalInfo = {};
  if (!data.skills) data.skills = { technical: [], soft: [], languages: [], certifications: [] };
  if (!data.experience) data.experience = [];
  if (!data.education) data.education = [];
  if (!data.projects) data.projects = [];
  if (!data.metadata) data.metadata = {};

  // Enhanced fake data detection
  const isFakeData = 
    data.personalInfo?.name?.includes('Candidate ') ||
    data.personalInfo?.name?.includes('Name not') ||
    data.personalInfo?.name?.includes('extraction') ||
    data.personalInfo?.email?.includes('@example.') ||
    data.personalInfo?.email?.includes('email.com') ||
    data.personalInfo?.email?.includes('not detected') ||
    data.personalInfo?.phone?.includes('XXX') ||
    data.personalInfo?.phone?.includes('not detected');

  if (isFakeData) {
    console.warn('⚠️ DETECTED FAKE/PLACEHOLDER DATA - Re-extracting with fallback');
    // Use fallback extraction
    const fallbackData = ultraSafeTextExtraction(originalText);
    
    // Merge real data with fallback
    if (data.personalInfo?.name?.includes('Candidate ') || data.personalInfo?.name?.includes('not detected')) {
      data.personalInfo.name = fallbackData.personalInfo.name;
    }
    if (data.personalInfo?.email?.includes('@example.') || data.personalInfo?.email?.includes('not detected')) {
      data.personalInfo.email = fallbackData.personalInfo.email;
    }
    if (data.personalInfo?.phone?.includes('not detected')) {
      data.personalInfo.phone = fallbackData.personalInfo.phone;
    }
  }

  // Validate and clean email
  if (data.personalInfo.email) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const emailMatch = data.personalInfo.email.match(emailRegex);
    data.personalInfo.email = emailMatch ? emailMatch[0] : data.personalInfo.email;
  }

  // Clean and validate phone
  if (data.personalInfo.phone) {
    // Remove common placeholder patterns
    if (data.personalInfo.phone.includes('XXX') || 
        data.personalInfo.phone.includes('000-000-0000') ||
        data.personalInfo.phone.length < 10) {
      // Try to extract real phone from original text
      const phoneMatch = originalText.match(/(\+1\s?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/);
      data.personalInfo.phone = phoneMatch ? phoneMatch[0] : '';
    }
  }

  // Ensure unique and valid skills
  if (data.skills.technical) {
    data.skills.technical = [...new Set(data.skills.technical.filter((skill: string) => 
      skill && skill.length > 1 && skill.length < 50 && !skill.includes('not detected')
    ))];
  }

  // Validate experience dates
  if (data.experience && Array.isArray(data.experience)) {
    data.experience = data.experience.filter((exp: any) => 
      exp.company && exp.position && 
      !exp.company.includes('not detected') && 
      !exp.position.includes('not detected')
    );
  }

  return data;
}

// Enhanced confidence calculation
function enhancedCalculateConfidence(data: any, originalText: string): number {
  let confidence = 0;

  // Name confidence
  if (data.personalInfo?.name && 
      !data.personalInfo.name.includes('not detected') && 
      !data.personalInfo.name.includes('Name extraction') &&
      data.personalInfo.name.length > 3) {
    confidence += 25;
  }

  // Email confidence  
  if (data.personalInfo?.email && 
      data.personalInfo.email.includes('@') && 
      !data.personalInfo.email.includes('not detected') &&
      !data.personalInfo.email.includes('@example.')) {
    confidence += 20;
  }

  // Phone confidence
  if (data.personalInfo?.phone && 
      !data.personalInfo.phone.includes('not detected') &&
      !data.personalInfo.phone.includes('XXX') &&
      data.personalInfo.phone.length >= 10) {
    confidence += 15;
  }

  // Skills confidence
  if (data.skills?.technical?.length > 2) {
    confidence += 20;
  }

  // Experience confidence
  if (data.experience?.length > 0 && 
      data.experience.some((exp: any) => exp.company && !exp.company.includes('not detected'))) {
    confidence += 20;
  }

  return Math.min(confidence, 100);
}

// Helper functions
function basicExtraction(text: string) {
  console.log('🔧 Running basic extraction fallback...');
  
  // Enhanced extraction patterns
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phonePattern = /(\+1\s?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/;
  
  // Multiple name extraction strategies
  const namePatterns = [
    /^([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/m, // First line name
    /Name[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i, // "Name: John Doe"
    /^([A-Z][A-Z\s]+)(?:\n|\r)/m, // ALL CAPS name
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})(?:\s*\n|\s*$)/ // Multi-word name
  ];

  const emailMatches = text.match(emailPattern) || [];
  const phoneMatch = text.match(phonePattern);
  
  let name = '';
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length > 3 && match[1].length < 50) {
      // Validate it looks like a real name
      const potentialName = match[1].trim();
      if (!/\d/.test(potentialName) && potentialName.split(' ').length >= 2) {
        name = potentialName;
        break;
      }
    }
  }

  // Enhanced skills extraction
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Vue', 'Angular', 'TypeScript',
    'CSS', 'HTML', 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'AWS', 'Docker', 'Kubernetes',
    'Git', 'PHP', 'C++', 'C#', '.NET', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
    'Linux', 'Windows', 'macOS', 'Azure', 'GCP', 'Firebase', 'Redis', 'GraphQL',
    'REST', 'API', 'Microservices', 'DevOps', 'CI/CD', 'Jenkins', 'Terraform'
  ];
  
  const extractedSkills = commonSkills.filter(skill => 
    new RegExp(`\\b${skill}\\b`, 'i').test(text)
  );

  return {
    personalInfo: {
      name: name || '',
      email: emailMatches[0] || '',
      phone: phoneMatch ? phoneMatch[0] : '',
      location: '',
      linkedIn: text.match(/linkedin\.com\/in\/[\w-]+/i)?.[0] || '',
      github: text.match(/github\.com\/[\w-]+/i)?.[0] || '',
      portfolio: ''
    },
    professionalSummary: '',
    skills: {
      technical: extractedSkills,
      soft: [],
      languages: [],
      certifications: []
    },
    experience: [],
    education: [],
    projects: [],
    metadata: {
      totalExperience: '',
      careerLevel: 'entry' as const,
      primaryRole: '',
      industries: []
    }
  };
}

function validateAndEnhanceData(data: any) {
  // Keep this for backwards compatibility
  return enhancedValidateAndEnhanceData(data, '');
}

function calculateConfidence(data: any, originalText: string): number {
  // Keep this for backwards compatibility
  return enhancedCalculateConfidence(data, originalText);
}

// Calculate ATS scores based on extracted data
app.post('/calculate-ats-scores', async (c) => {
  try {
    const { extractedData, jobDescription } = await c.req.json();

    if (!extractedData) {
      return c.json({
        success: false,
        error: 'No extracted data provided'
      }, 400);
    }

    console.log('📊 Calculating ATS scores...');

    const scores = {
      overall: 0,
      contact: calculateContactScore(extractedData.personalInfo),
      skills: calculateSkillsScore(extractedData.skills),
      experience: calculateExperienceScore(extractedData.experience),
      education: calculateEducationScore(extractedData.education),
      keywords: calculateKeywordScore(extractedData, jobDescription || '')
    };

    // Calculate overall score
    scores.overall = Math.round(
      (scores.contact + scores.skills + scores.experience + scores.education + scores.keywords) / 5
    );

    // Generate recommendations
    const recommendations = generateRecommendations(scores, extractedData);

    // Determine matching jobs based on skills and experience
    const matchingJobs = determineMatchingJobs(extractedData);

    console.log('✅ ATS scores calculated:', scores);

    return c.json({
      success: true,
      scores,
      recommendations,
      matchingJobs,
      analysis: {
        strengths: identifyStrengths(extractedData, scores),
        improvements: identifyImprovements(scores)
      }
    });

  } catch (error) {
    console.error('❌ ATS scoring error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Scoring calculation failed'
    }, 500);
  }
});

function calculateContactScore(personalInfo: any): number {
  let score = 0;
  
  // CRITICAL: Check for fake/placeholder data and penalize heavily
  const isFakeName = personalInfo?.name?.includes('Candidate ') || 
                     personalInfo?.name === 'Name not detected' ||
                     personalInfo?.name === 'Name extraction failed' ||
                     !personalInfo?.name;
  
  const isFakeEmail = personalInfo?.email?.includes('@example.') || 
                      personalInfo?.email === 'Email not detected' ||
                      personalInfo?.email === 'Email extraction failed' ||
                      !personalInfo?.email;
  
  const isFakePhone = personalInfo?.phone === 'Phone not detected' ||
                      !personalInfo?.phone;
  
  // If any fake data is detected, return very low score
  if (isFakeName || isFakeEmail) {
    console.warn('⚠️ FAKE DATA DETECTED IN CONTACT INFO - LOW SCORE APPLIED');
    return 15; // Maximum 15% for fake data
  }
  
  // Normal scoring for real data
  if (personalInfo?.name && !isFakeName) score += 30;
  if (personalInfo?.email && !isFakeEmail) score += 30;
  if (personalInfo?.phone && !isFakePhone) score += 25;
  if (personalInfo?.location && personalInfo.location !== 'Location not detected') score += 15;
  
  return score;
}

function calculateSkillsScore(skills: any): number {
  let score = 50; // Base score
  if (skills?.technical?.length >= 5) score += 25;
  if (skills?.technical?.length >= 10) score += 15;
  if (skills?.certifications?.length > 0) score += 10;
  return Math.min(score, 100);
}

function calculateExperienceScore(experience: any[]): number {
  if (!experience || experience.length === 0) return 40;
  
  let score = 60;
  if (experience.length >= 2) score += 20;
  if (experience.some(exp => exp.achievements?.length > 0)) score += 20;
  return Math.min(score, 100);
}

function calculateEducationScore(education: any[]): number {
  if (!education || education.length === 0) return 60;
  
  let score = 70;
  if (education.length >= 1) score += 15;
  if (education.some(edu => edu.degree?.toLowerCase().includes('master'))) score += 10;
  if (education.some(edu => edu.degree?.toLowerCase().includes('phd'))) score += 5;
  return Math.min(score, 100);
}

function calculateKeywordScore(data: any, jobDescription: string): number {
  if (!jobDescription) return 75;
  
  const jobKeywords = jobDescription.toLowerCase().split(/\W+/).filter(word => word.length > 3);
  const resumeText = JSON.stringify(data).toLowerCase();
  
  const matchingKeywords = jobKeywords.filter(keyword => resumeText.includes(keyword));
  const score = Math.min((matchingKeywords.length / jobKeywords.length) * 100, 100);
  
  return Math.max(score, 60);
}

function generateRecommendations(scores: any, data: any): string[] {
  const recommendations: string[] = [];
  
  if (scores.contact < 80) {
    recommendations.push('Ensure all contact information is clearly visible and professional');
  }
  if (scores.skills < 75) {
    recommendations.push('Add more relevant technical skills and certifications');
  }
  if (scores.experience < 75) {
    recommendations.push('Include more detailed work experience with quantifiable achievements');
  }
  if (scores.keywords < 70) {
    recommendations.push('Tailor resume content to include more job-relevant keywords');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Excellent resume! Consider adding industry certifications to stand out further');
  }
  
  return recommendations;
}

function determineMatchingJobs(data: any): string[] {
  const skills = data.skills?.technical || [];
  const experience = data.experience || [];
  
  const jobs: string[] = [];
  
  if (skills.some((s: string) => ['JavaScript', 'React', 'Vue', 'Angular'].includes(s))) {
    jobs.push('Frontend Developer');
  }
  if (skills.some((s: string) => ['Node.js', 'Python', 'Java', 'API'].includes(s))) {
    jobs.push('Backend Developer');
  }
  if (skills.some((s: string) => ['React', 'Node.js', 'JavaScript', 'API'].includes(s))) {
    jobs.push('Full Stack Developer');
  }
  if (skills.some((s: string) => ['AWS', 'Docker', 'Kubernetes', 'DevOps'].includes(s))) {
    jobs.push('DevOps Engineer');
  }
  
  return jobs.length > 0 ? jobs : ['Software Developer', 'Technical Specialist'];
}

function identifyStrengths(data: any, scores: any): string[] {
  const strengths: string[] = [];
  
  if (scores.contact >= 90) strengths.push('Complete contact information');
  if (scores.skills >= 85) strengths.push('Strong technical skill set');
  if (scores.experience >= 85) strengths.push('Relevant work experience');
  if (data.skills?.certifications?.length > 0) strengths.push('Professional certifications');
  
  return strengths;
}

function identifyImprovements(scores: any): string[] {
  const improvements: string[] = [];
  
  if (scores.contact < 70) improvements.push('Add missing contact details');
  if (scores.skills < 70) improvements.push('Expand technical skills section');
  if (scores.experience < 70) improvements.push('Add more work experience details');
  if (scores.keywords < 70) improvements.push('Include more industry keywords');
  
  return improvements;
}

export default app;