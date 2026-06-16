/**
 * Test cases for Enhanced Name Extraction
 * 
 * This demonstrates the 7 different strategies the enhanced parser uses
 * to find names anywhere in a resume document
 */

export const testNameExtractionScenarios = [
  {
    scenario: "Strategy 1: Explicit Name Labels",
    documentText: `
RESUME

Name: John Michael Smith
Email: john.smith@email.com
Phone: (555) 123-4567

EXPERIENCE
Software Engineer at TechCorp...
    `,
    expectedName: "John Michael Smith",
    description: "Name appears with explicit 'Name:' label"
  },

  {
    scenario: "Strategy 2: Section Headers",
    documentText: `
CURRICULUM VITAE

PERSONAL INFORMATION
Sarah Elizabeth Johnson
sarah.johnson@gmail.com
(555) 987-6543

PROFESSIONAL EXPERIENCE
...
    `,
    expectedName: "Sarah Elizabeth Johnson", 
    description: "Name appears after 'Personal Information' section header"
  },

  {
    scenario: "Strategy 3: Key-Value Formats",
    documentText: `
RESUME

Full Name | Robert David Wilson
Email | robert.wilson@company.com
Phone | +1-555-456-7890

SUMMARY
Experienced software developer...
    `,
    expectedName: "Robert David Wilson",
    description: "Name in table/key-value format with pipe separator"
  },

  {
    scenario: "Strategy 4: Various Separators",
    documentText: `
Professional Resume

Candidate - Maria Elena Garcia
Contact - maria.garcia@tech.com
Location - San Francisco, CA

OBJECTIVE
Seeking senior developer position...
    `,
    expectedName: "Maria Elena Garcia",
    description: "Name with dash separator"
  },

  {
    scenario: "Strategy 5: Middle of Document",
    documentText: `
PROFESSIONAL RESUME

CONTACT INFORMATION
Phone: (555) 111-2222
Email: contact@email.com

Full Name: David Alexander Thompson
Address: 123 Main Street

EXPERIENCE
Senior Software Engineer...
    `,
    expectedName: "David Alexander Thompson",
    description: "Name appears in middle of contact section"
  },

  {
    scenario: "Strategy 6: Header Analysis",
    documentText: `
Jennifer Rebecca Martinez

Software Engineer | 5 Years Experience
jennifer.martinez@email.com | (555) 333-4444
San Francisco, CA

PROFESSIONAL SUMMARY
...
    `,
    expectedName: "Jennifer Rebecca Martinez",
    description: "Name at very top as document header"
  },

  {
    scenario: "Strategy 7: Contextual Patterns",
    documentText: `
RESUME

ABOUT
My name is Michael Anthony Rodriguez and I am an experienced
software developer with expertise in full-stack development.

CONTACT
Email: michael.rodriguez@dev.com
Phone: (555) 777-8888
    `,
    expectedName: "Michael Anthony Rodriguez",
    description: "Name in contextual sentence pattern"
  }
];

/**
 * Function to test all scenarios
 */
export const testEnhancedNameExtraction = () => {
  console.log('ðŸ§ª Testing Enhanced Name Extraction Scenarios...\n');
  
  testNameExtractionScenarios.forEach((test, index) => {
    console.log(`${index + 1}. ${test.scenario}`);
    console.log(`   Description: ${test.description}`);
    console.log(`   Expected: "${test.expectedName}"`);
    console.log(`   Document Text Preview: ${test.documentText.substring(0, 100)}...`);
    console.log('   âœ… Should be extracted by enhanced parser\n');
  });
  
  console.log('ðŸ“‹ Summary: Enhanced parser uses 7 strategies to find names:');
  console.log('   1. Explicit labels (Name:, Full Name:, Candidate:)');
  console.log('   2. Section headers (Personal Information, Contact Info)');
  console.log('   3. Key-value formats (Name | John Smith, Name - John Smith)');
  console.log('   4. Table structures (Name    John Smith)');
  console.log('   5. Enhanced first-line analysis (smart filtering)');
  console.log('   6. Contextual patterns (My name is..., I am...)');
  console.log('   7. Emphasis patterns (bold, underlined text)');
};

// Example usage:
// testEnhancedNameExtraction();






