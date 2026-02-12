import os
from typing import Dict, List, Any, Optional, Union, TypeVar
import json
from langchain_google_genai import GoogleGenerativeAI
from langchain_google_genai import HarmBlockThreshold, HarmCategory
from dotenv import load_dotenv
import re

# Load environment variables from .env file
load_dotenv()

T = TypeVar("T")


class LLM:
    """Simple wrapper class for Google Gemini API with JSON schema support."""

    def __init__(
        self,
        model_name: str = None,
        temperature: float = None,
        max_output_tokens: int = None,
        top_p: float = None,
        top_k: int = None,
        api_key: str = None,
        system_prompt: str = None,
        system_prompt_file: str = None,
    ):
        # Get values from parameters or environment variables
        self.model_name = model_name or os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        self.temperature = temperature or float(os.getenv("GEMINI_TEMPERATURE", "0.7"))
        self.max_output_tokens = max_output_tokens or int(
            os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "8192")
        )
        self.top_p = top_p or float(os.getenv("GEMINI_TOP_P", "0.95"))
        self.top_k = top_k or int(os.getenv("GEMINI_TOP_K", "40"))
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")

        # Handle system prompt
        if system_prompt:
            self.system_prompt = system_prompt
        elif system_prompt_file:
            self.system_prompt = self._load_system_prompt(system_prompt_file)
        elif os.getenv("GEMINI_SYSTEM_PROMPT_FILE"):
            self.system_prompt = self._load_system_prompt(
                os.getenv("GEMINI_SYSTEM_PROMPT_FILE")
            )
        else:
            self.system_prompt = os.getenv("GEMINI_SYSTEM_PROMPT")

        # Initialize model
        self._llm = self._initialize_llm()

    def _load_system_prompt(self, file_path: str) -> Optional[str]:
        """Load system prompt from file."""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            print(f"Cannot read system prompt file: {e}")
            return None

    def _initialize_llm(self) -> GoogleGenerativeAI:
        """Initialize Google Gemini model."""
        if not self.api_key:
            raise ValueError(
                "API key not provided and not found in GOOGLE_API_KEY environment variable"
            )

        # Configure safety settings to disable all blocks
        safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }

        return GoogleGenerativeAI(
            model=self.model_name,
            temperature=self.temperature,
            max_output_tokens=self.max_output_tokens,
            top_p=self.top_p,
            top_k=self.top_k,
            google_api_key=self.api_key,
            safety_settings=safety_settings,
        )

    def invoke(
        self, prompt: str, stop: Optional[List[str]] = None, **kwargs: Any
    ) -> str:
        """Call the model with a prompt."""
        if self.system_prompt:
            prompt = f"{self.system_prompt}\n\n{prompt}"

        return self._llm.invoke(prompt, stop=stop, **kwargs)

    def invoke_json(
        self,
        prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        type_hint: Optional[type] = None,
        max_retries: int = 3,
        **kwargs: Any,
    ) -> Union[Dict[str, Any], T]:
        """
        Call the model and parse response as JSON.
        """
        # Create prompt requesting JSON format response
        schema_str = json.dumps(schema, indent=2, ensure_ascii=False) if schema else "Any valid JSON object"
        
        json_prompt = f"""
You are a strictly compliant JSON generator.
Task: Answer the user's request and output the result as a VALID JSON object.

Schema Requirement:
{schema_str}

User Request: {prompt}

CRITICAL JSON RULES:
1. Output MUST be valid JSON.
2. Escape ALL double quotes within string values (e.g., "content": "He said \\"Hello\\"").
3. Do NOT include any text before or after the JSON.
4. Do NOT use markdown code blocks (like ```json), just raw JSON.
5. Ensure the JSON is complete and not truncated.
"""

        retry_count = 0
        last_error = None
        result_text = ""

        while retry_count <= max_retries:
            try:
                # Call model
                # Override temperature to be lower for valid JSON generation
                kwargs["temperature"] = 0.1 
                response = self.invoke(json_prompt, **kwargs)
                
                # Process result to extract JSON
                result_text = response.strip()

                # Robust cleaning of markdown blocks
                if "```json" in result_text:
                    pattern = r"```json(.*?)```"
                    matches = re.findall(pattern, result_text, re.DOTALL)
                    if matches:
                        result_text = matches[0].strip()
                    else:
                        # Fallback if closing fence is missing
                        result_text = result_text.split("```json")[1].strip()
                elif "```" in result_text:
                     pattern = r"```(.*?)```"
                     matches = re.findall(pattern, result_text, re.DOTALL)
                     if matches:
                        result_text = matches[0].strip()

                # Clean comments
                result_text = re.sub(r"//.*", "", result_text)
                result_text = re.sub(r"/\*.*?\*/", "", result_text, flags=re.DOTALL)
                
                # Clean trailing commas (common error)
                result_text = re.sub(r",\s*}", "}", result_text)
                result_text = re.sub(r",\s*]", "]", result_text)

                # Try to parse JSON
                json_result = json.loads(result_text)
                
                # If successful, return result
                if type_hint:
                    from pydantic import parse_obj_as
                    return parse_obj_as(type_hint, json_result)
                return json_result
                
            except Exception as e:
                last_error = e
                retry_count += 1
                print(f"JSON Parse Error (Attempt {retry_count}/{max_retries}): {str(e)}")
                # print(f"Failed JSON snippet: {result_text[:100]}...") # Debug log
                
                # If error and retries remaining, simplify the prompt
                if retry_count <= max_retries:
                    error_msg = str(e)
                    json_prompt = f"""
ERROR: Your previous response was NOT valid JSON.
Error specific: {error_msg}

FIX INSTRUCTIONS:
1. Review the error and fix the syntax.
2. Specifically check for unescaped double quotes inside strings.
3. Ensure all brackets {{}} and [] are closed.
4. Output RAW JSON ONLY.

User Request: {prompt}
"""
                else:
                    break  # Exit loop to raise error

        # If all retries have been used
        raise ValueError(
            f"Cannot parse JSON after {max_retries} retries: {str(last_error)}"
        )

    @classmethod
    def from_defaults(cls):
        """Create instance with default configuration."""
        return cls()

    @classmethod
    def with_system_prompt(
        cls, system_prompt_file: str = "system_prompt.md", api_key: str = None
    ):
        """Create instance with system prompt from file."""
        return cls(system_prompt_file=system_prompt_file, api_key=api_key)


if __name__ == "__main__":
    # Simple test to verify LLM is working
    try:
        llm = LLM.from_defaults()
        response = llm.invoke("Say 'LLM initialized successfully' if you can read this.")
        print(response)
    except Exception as e:
        print(f"Error: {e}")
