# Agniveer Army Bharti JSON Format

To add Agniveer mock papers, please create JSON files with the following structure and upload them via the **Admin Panel**.

### JSON Structure Example
```json
{
  "examType": "agniveer_army",
  "district": "mock",
  "year": 1,
  "name": "Agniveer Army Mock Paper 1",
  "sections": [
    {
      "id": "gk",
      "questions": [
        {
          "q": "भारताचे पहिले संरक्षण मंत्री कोण होते?",
          "options": ["सरदार पटेल", "बलदेव सिंह", "व्ही. के. कृष्ण मेनन", "यशवंतराव चव्हाण"],
          "answer": 1
        }
      ]
    },
    {
      "id": "science",
      "questions": [
        {
          "q": "पाण्याचे रासायनिक सूत्र काय आहे?",
          "options": ["CO2", "H2O", "O2", "NaCl"],
          "answer": 1
        }
      ]
    },
    {
      "id": "math",
      "questions": [
        {
          "q": "१० चा वर्ग किती?",
          "options": ["५०", "१००", "२००", "४००"],
          "answer": 1
        }
      ]
    },
    {
      "id": "reasoning",
      "questions": [
        {
          "q": "मालिकेतील पुढील संख्या शोधा: २, ४, ६, ८, ?",
          "options": ["९", "१०", "११", "१२"],
          "answer": 1
        }
      ]
    }
  ]
}
```

### Key Rules:
1. **examType**: Must be `"agniveer_army"`.
2. **district**: Use `"mock"` for practice sets.
3. **year**: Use a number (e.g., `1`, `2`, `3`) to distinguish between different mock papers.
4. **sections**: Use the following IDs for consistent icons:
   - `gk` (General Knowledge)
   - `science` (General Science)
   - `math` (Mathematics)
   - `reasoning` (Logical Reasoning)
5. **answer**: Use `0` for A, `1` for B, `2` for C, and `3` for D.
