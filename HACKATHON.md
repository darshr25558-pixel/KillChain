## Team Name
SoloLeveling

## Team Members
1) [Darsh Rustagi](mailto:darsh.r25558@nst.rishihood.edu.in) 
2) [Moksh Bansal](mailto:moksh.b25279@nst.rishihood.edu.in)
3) [Mudit Jindal](mailto:mudit.j25284@nst.rishihood.edu.in)
                

## Selected Problem Statement
**Published Package vs Source Code Integrity Analyzer**


## AI Models Used

### 1. DeepSeek V4.1 Flash

- **Purpose:** Primary AI model for implementation planning, code generation, debugging, security-analysis assistance, and explaining detected package differences. It will also help convert deterministic scanner findings into clear, evidence-based security reports.
- **Reason for Selection:** Selected as the primary model for its strong coding and reasoning capabilities, fast response times, and suitability for rapid development within the hackathon's limited timeframe. Its ability to work with technical code and structured evidence makes it suitable for KILLCHAIN's software supply-chain analysis workflow.

### 2. Google Gemma

- **Purpose:** Secondary model and alternative for AI-powered security explanations, summarization of scan results, and assistance with code analysis. It can serve as a fallback if the primary model is unavailable or resource constraints require an alternative.
- **Reason for Selection:** Selected as an alternative because of its lightweight model options, open-weight availability, and potential for local deployment. It provides flexibility in deployment and reduces dependence on a single AI model.

## Model Selection Strategy

We selected a primary-secondary model strategy to balance reasoning quality, implementation speed, reliability, and resource constraints.

DeepSeek V4.1 Flash will serve as the primary model for development assistance and evidence-based security explanations, while Gemma will provide a secondary option for alternative analysis and fallback support.

KILLCHAIN will not rely on AI alone to determine whether a package is malicious. Core integrity verification, file comparison, provenance checks, and suspicious-behavior detection will be performed through deterministic analysis. AI models will assist in interpreting these findings and generating understandable explanations.

This separation ensures that security decisions remain grounded in verifiable evidence rather than unsupported AI predictions.
