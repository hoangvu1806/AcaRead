# Server Schemas

This directory contains the JSON schema definitions used to enforce structured output from the Large Language Model (LLM). These schemas are critical for ensuring that the AI generates valid, consistent, and parseable content for the exam generation pipeline.

## Purpose

The primary function of these schemas is to guide the AI model (Google Gemini) in generating data that strictly adheres to the application's internal data structures. By providing a clear schema, we eliminate hallucinated formats and ensure type safety directly from the generation step.

## Directory Structure

### `ielts/`
Contains schemas specific to the IELTS examination format. Each file corresponds to a specific question type or exam component.

- **`multiple_choice_schema.json`**: Structure for standard multiple-choice questions.
- **`true_false_not_given_schema.json`**: Structure for T/F/NG questions.
- **`matching_headings_schema.json`**: Structure for paragraph heading matching tasks.
- **`summary_completion_schema.json`**: Structure for summary completion exercises.
- **`short_answer_schema.json`**: Structure for short answer questions.
- **`matching_features_schema.json`**: Structure for matching features/names tasks.

## Usage

These JSON files are loaded by the `LLM` wrapper class and passed to the AI model during the prompt construction phase. The application parses the returned JSON string against these schemas to validate the integrity of the generated exam content before storing it in the database.
