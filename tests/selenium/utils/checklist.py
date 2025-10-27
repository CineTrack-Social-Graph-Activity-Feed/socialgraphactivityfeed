# tests/selenium/utils/checklist.py
from dataclasses import dataclass, field
from typing import List, Dict
from datetime import datetime

@dataclass
class Step:
    name: str
    ok: bool
    message: str = ""

@dataclass
class Checklist:
    test_name: str
    module_name: str
    started_at: datetime
    steps: List[Step] = field(default_factory=list)

    def check(self, name: str, condition: bool, message: str = ""):
        self.steps.append(Step(name=name, ok=bool(condition), message=message))

    @property
    def total(self) -> int:
        return len(self.steps)

    @property
    def passed(self) -> int:
        return sum(1 for s in self.steps if s.ok)

    def summary_dict(self) -> Dict:
        return {
            "module": self.module_name,
            "test": self.test_name,
            "started_at": self.started_at.strftime("%Y%m%d_%H:%M"),
            "steps": [dict(name=s.name, ok=s.ok, message=s.message) for s in self.steps],
            "passed_steps": self.passed,
            "total_steps": self.total,
        }
