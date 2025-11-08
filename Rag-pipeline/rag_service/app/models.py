from typing import List, Optional

from pydantic import BaseModel


class TestCase(BaseModel):
    input: Optional[str] = None
    expectedOutput: Optional[str] = None
    actualOutput: Optional[str] = None
    status: Optional[str] = None
    passed: Optional[bool] = None
    errorMessage: Optional[str] = None
    executionTime: Optional[int] = None


class SubmissionMeta(BaseModel):
    id: Optional[str] = None
    verdict: Optional[str] = None
    passedTests: Optional[int] = None
    totalTests: Optional[int] = None


class ProblemMeta(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None


class Submission(BaseModel):
    code: str
    language: str
    output: str
    expectedOutput: str
    problem: Optional[ProblemMeta] = None
    testCases: Optional[List[TestCase]] = None
    submission: Optional[SubmissionMeta] = None


class WebsiteSource(BaseModel):
    url: str
    language: str
