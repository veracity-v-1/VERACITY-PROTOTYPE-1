"""
chatbot_service.py --- Project Veracity Phase 3 (Conversational Edition)
Rule-based chatbot for code risk mitigation advice.
Conversational flow: menu → drill-down → fix steps → close.
Designed for non-technical stakeholders.
"""
import json
import os
import re
from typing import List, Dict, Optional
from dataclasses import dataclass, field


# ── Session State (lightweight, per-conversation) ───────────────────

@dataclass
class ChatSession:
    """Tracks what the user has seen so we don't repeat or dump everything."""
    session_id: str
    risk_level: str = ""
    top_features: List[Dict] = field(default_factory=list)
    features_seen: List[str] = field(default_factory=list)
    current_menu: str = "main"
    conversation_turn: int = 0
    user_name: Optional[str] = None


# ── Embedded default human-friendly rules ───────────────────────────

DEFAULT_RULES = {
    "v(g)": {
        "display_name": "Decision Overload",
        "emoji": "🍝",
        "simple_explanation": "Your code is like spaghetti — too many twists and turns. Every 'if', 'for', and 'while' is a decision point that can hide a bug.",
        "threshold": 10,
        "severity_color": "red",
        "fix_title": "Make It a Straight Road",
        "fix_explanation": "Break the long function into smaller ones. Each helper should do exactly one thing, like a single step in a recipe.",
        "steps": [
            "Find the longest function in your file",
            "Count the 'if', 'else', 'for', and 'while' words — if more than 5-7, it's too long",
            "Pull out chunks into smaller helper functions with clear names",
            "Aim for each function to fit on your screen without scrolling"
        ],
        "analogy": "Imagine giving directions to a building. A score of 3 means 'go straight, turn left'. A score of 15 means 'at every door, choose left/right/up/down, then inside each room choose again'. You'd need a map.",
        "why_care": "More paths = more places for bugs to hide. Testing every path becomes impossible.",
        "real_impact": "This function is 55% more complex than the safe limit. It's the #1 reason this file was flagged as risky.",
        "priority": 1
    },
    "e": {
        "display_name": "Mental Marathon",
        "emoji": "😵",
        "simple_explanation": "Understanding this code is exhausting. It's like reading a legal contract written in one giant paragraph with no headings.",
        "threshold": 10000,
        "severity_color": "red",
        "fix_title": "Add Subtitles",
        "fix_explanation": "Add comments explaining what each section does, use clear variable names, and add blank lines between logical sections.",
        "steps": [
            "Add a one-line comment above every 5-10 lines explaining what that block does",
            "Rename single-letter variables (like 'x', 'i') to describe what they hold",
            "Add blank lines between different 'paragraphs' of code",
            "If you can't explain a section in one sentence, split it"
        ],
        "analogy": "Think of code like a textbook. This file has no chapters, no headings, and no page breaks. It's all one dense wall of text.",
        "why_care": "The next developer (or you in 3 months) will spend hours figuring out what this does. That time is money and risk.",
        "real_impact": "The effort score is 25% above safe levels. Teams spend 40% more time debugging files like this.",
        "priority": 2
    },
    "b": {
        "display_name": "Accident Waiting to Happen",
        "emoji": "💣",
        "simple_explanation": "Math says bugs are hiding here. This metric predicts how many defects this file likely contains based on its complexity patterns.",
        "threshold": 2,
        "severity_color": "red",
        "fix_title": "Install Safety Nets",
        "fix_explanation": "Write tests that check your code works, and add type hints so the computer catches mistakes before they reach users.",
        "steps": [
            "Write a test for the most complex function — check it works AND check it fails gracefully",
            "Add type hints to function inputs (e.g., def process(data: list) -> dict:)",
            "Run the tests after every change to catch breaks early",
            "Ask a teammate to review the trickiest parts"
        ],
        "analogy": "This is like a smoke detector. The house isn't on fire yet, but the conditions are right. Installing detectors (tests) now saves you later.",
        "why_care": "Files with this score have 3x more production bugs than average. Catching them in testing is 10x cheaper than after release.",
        "real_impact": "Predicted bug count is 60% above the safety threshold. This is the second-highest risk factor in your file.",
        "priority": 1
    },
    "v": {
        "display_name": "Information Overload",
        "emoji": "📚",
        "simple_explanation": "This code packs too much information into too little space. It's like a PowerPoint slide with 50 bullet points.",
        "threshold": 500,
        "severity_color": "orange",
        "fix_title": "Spread It Out",
        "fix_explanation": "Use Python's built-in shortcuts and break compound expressions into smaller steps with intermediate variables.",
        "steps": [
            "Replace manual loops with Python built-ins like sum(), max(), any()",
            "Use list comprehensions for simple transformations",
            "Break one-line expressions into 2-3 lines with named intermediate steps",
            "Remove duplicate logic by extracting reusable helpers"
        ],
        "analogy": "A good presentation has 3-5 points per slide. This code has 50. No one can absorb that much at once.",
        "why_care": "Dense code is harder to review, harder to test, and harder to modify without breaking something.",
        "real_impact": "Volume is 15% above recommended. Moderate concern — fix after handling Decision Overload and Accident Waiting to Happen.",
        "priority": 2
    },
    "d": {
        "display_name": "Hard to Write Right",
        "emoji": "🧩",
        "simple_explanation": "This code uses unusual patterns that are easy to get wrong. It's like assembling furniture with confusing instructions.",
        "threshold": 30,
        "severity_color": "orange",
        "fix_title": "Use Standard Tools",
        "fix_explanation": "Stick to common patterns from Python's standard library. If you need something exotic, add extra tests and documentation.",
        "steps": [
            "Replace custom solutions with standard library functions",
            "If you must use a rare pattern, add a comment explaining WHY",
            "Have a teammate review any 'clever' code",
            "Add extra tests for the trickiest functions"
        ],
        "analogy": "IKEA furniture uses standard screws everyone understands. Custom hardware needs custom tools and more chances to mess up.",
        "why_care": "Unusual code patterns have higher error rates because fewer people understand them well enough to review or fix.",
        "real_impact": "Difficulty is 12% above threshold. Low priority — address only if time permits after critical issues.",
        "priority": 3
    },
    "loc": {
        "display_name": "Too Long to Handle",
        "emoji": "📏",
        "simple_explanation": "This file is very long. Big files are harder to navigate, review, and test thoroughly.",
        "threshold": 200,
        "severity_color": "orange",
        "fix_title": "Divide and Conquer",
        "fix_explanation": "Split the file into smaller modules, each responsible for one concept. Like organizing a messy closet into labeled boxes.",
        "steps": [
            "Group related functions into separate files",
            "Move utility functions to a shared utils.py",
            "Keep one main concept per file",
            "Aim for files under 200 lines"
        ],
        "analogy": "A 500-page textbook with no chapters vs. a set of 50-page booklets on specific topics. Which would you rather study?",
        "why_care": "Long files correlate with more bugs because developers lose track of what's where during changes.",
        "real_impact": "File is 25% over the recommended length. Consider splitting when you next refactor.",
        "priority": 3
    },
    "branchcount": {
        "display_name": "Too Many Forks in the Road",
        "emoji": "🔀",
        "simple_explanation": "Your code has many branch points (if/else chains). Each branch is a path that needs testing.",
        "threshold": 15,
        "severity_color": "orange",
        "fix_title": "Simplify the Map",
        "fix_explanation": "Replace long if-elif chains with lookup tables or polymorphism. Fewer branches = fewer things to test.",
        "steps": [
            "Replace if-elif chains with dictionaries mapping inputs to outputs",
            "Use polymorphism (different classes for different behaviors)",
            "Extract complex decision logic into a separate function",
            "Add tests for every branch — if there are too many, that's a sign to simplify"
        ],
        "analogy": "A restaurant menu with 50 options vs. 5 categories with 3 options each. Easier to choose, easier to manage.",
        "why_care": "Every untested branch is a potential bug in production. More branches = exponentially more test cases needed.",
        "real_impact": "Branch count is 18% above safe levels. Moderate priority for testing coverage.",
        "priority": 2
    },
    "v_density": {
        "display_name": "Concentrated Complexity",
        "emoji": "⚡",
        "simple_explanation": "Complexity is packed into a small space. Like a power strip with too many plugs — one surge affects everything.",
        "threshold": 0.5,
        "severity_color": "orange",
        "fix_title": "Spread the Load",
        "fix_explanation": "Break complex expressions into smaller steps. Spread the logic across more lines with intermediate variables.",
        "steps": [
            "Break one-line expressions into multiple lines",
            "Use intermediate variables to name each step",
            "Add early returns to reduce nesting",
            "Extract the most complex part into its own function"
        ],
        "analogy": "A power strip with 10 devices plugged in is risky. Spread them across multiple strips (functions) with proper spacing.",
        "why_care": "Concentrated complexity means one small change can break many things at once. Higher ripple effect.",
        "real_impact": "Complexity density is 20% above threshold. Address by breaking up the densest functions.",
        "priority": 2
    },
    "ev_ratio": {
        "display_name": "Messy Structure",
        "emoji": "🌪️",
        "simple_explanation": "A high portion of your complexity is 'unstructured' — nested loops, gotos, or deeply nested conditionals.",
        "threshold": 0.8,
        "severity_color": "orange",
        "fix_title": "Restructure the Flow",
        "fix_explanation": "Replace nested conditionals with structured loops or state machines. Flatten the control flow.",
        "steps": [
            "Replace nested ifs with early returns or guard clauses",
            "Use structured loops instead of nested loops",
            "Consider a state machine for complex multi-step logic",
            "Extract nested blocks into named helper functions"
        ],
        "analogy": "A messy closet where everything is piled on everything else vs. a closet with shelves and labeled bins.",
        "why_care": "Unstructured complexity is the hardest to test and debug because the flow jumps around unpredictably.",
        "real_impact": "Essential ratio is 10% above threshold. Low priority — refactor during next scheduled maintenance.",
        "priority": 3
    },
}


# ── Intent Detection (lightweight regex) ────────────────────────────

INTENT_PATTERNS = {
    # Greetings
    r'^(hi|hello|hey|greetings|howdy|yo)\b': 'greeting',
    r'^(good (morning|afternoon|evening))': 'greeting',
    
    # Explain specific metrics
    r'what.*v\(g\)|what.*cyclomatic|explain.*decision|what.*spaghetti': 'explain_vg',
    r'what.*\be\b|what.*effort|explain.*mental|what.*marathon': 'explain_e',
    r'what.*\bb\b|what.*bug|explain.*accident|what.*safety': 'explain_b',
    r'what.*\bv\b|what.*volume|explain.*overload|what.*information': 'explain_v',
    r'what.*\bd\b|what.*difficulty|explain.*hard|what.*puzzle': 'explain_d',
    r'what.*loc|what.*lines|explain.*long|what.*length': 'explain_loc',
    r'what.*branch|explain.*fork|what.*forks': 'explain_branchcount',
    r'what.*density|explain.*concentrated|what.*complexity density': 'explain_v_density',
    r'what.*ratio|explain.*messy|what.*structure': 'explain_ev_ratio',
    
    # Navigation / Actions
    r'show.*all|everything|all issues|list all': 'show_all',
    r'biggest|worst|most urgent|priority|first|top': 'show_priority',
    r'fix|how.*fix|help|what.*do|solution|steps': 'show_fix',
    r'why.*care|why.*matter|so what|why important': 'explain_why_care',
    r'analogy|like what|compare|example|simple way': 'explain_analogy',
    r'metric.*number|show.*score|what.*value|my score': 'show_numbers',
    
    # Low risk follow-ups
    r'what.*safe|why.*low|what.*good|why healthy': 'explain_low',
    r'show.*metric|show.*number|the numbers': 'show_numbers',
    r'how.*keep|stay.*safe|maintain|prevent': 'explain_prevent',
    
    # Closing
    r'done|finished|bye|goodbye|thank|thanks|that\'?s all|exit|quit': 'closing',
    
    # Help / Fallback
    r'help|what.*can.*do|what.*option|menu|start over': 'show_menu',
}


# ── Chatbot Service ───────────────────────────────────────────────

class ChatbotService:
    def __init__(self, rules_path: str = None):
        """
        Initialize chatbot with mitigation rules.
        If rules_path is provided, loads from JSON file.
        Otherwise uses embedded default rules.
        """
        if rules_path and os.path.exists(rules_path):
            with open(rules_path, encoding='utf-8') as f:
                loaded = json.load(f)
                # Merge loaded rules with defaults (defaults win for missing fields)
                self.rules = {}
                for key, val in loaded.items():
                    self.rules[key] = {**DEFAULT_RULES.get(key, {}), **val}
                # Add any default rules not in loaded file
                for key, val in DEFAULT_RULES.items():
                    if key not in self.rules:
                        self.rules[key] = val
            print(f"✅ Loaded human-friendly rules from: {rules_path}")
        else:
            self.rules = DEFAULT_RULES
            if rules_path:
                print(f"⚠️  Rules file not found: {rules_path}")
                print("   Using embedded default rules.")
            else:
                print("   Using embedded default rules.")
        
        # Session storage (in-memory, per-process; replace with Redis for production)
        self.sessions: Dict[str, ChatSession] = {}

    # ── Intent Detection ────────────────────────────────────────────

    def detect_intent(self, text: str) -> str:
        """Map free-form user input to a known intent."""
        text_lower = text.lower().strip()
        for pattern, intent in INTENT_PATTERNS.items():
            if re.search(pattern, text_lower):
                return intent
        return 'unknown'

    # ── Session Management ──────────────────────────────────────────

    def get_or_create_session(self, session_id: str, risk_level: str = None,
                              top_features: List[Dict] = None) -> ChatSession:
        """Get existing session or create new one."""
        if session_id not in self.sessions:
            self.sessions[session_id] = ChatSession(
                session_id=session_id,
                risk_level=risk_level or '',
                top_features=top_features or []
            )
        return self.sessions[session_id]

    def reset_session(self, session_id: str) -> None:
        """Clear session state."""
        if session_id in self.sessions:
            del self.sessions[session_id]

    # ── Message Builders ────────────────────────────────────────────

    def _build_menu(self, session: ChatSession) -> dict:
        """Build the main interaction menu based on risk level."""
        if session.risk_level == 'LOW':
            return {
                'type': 'menu',
                'emoji': '✅',
                'text': f'Good news, {session.user_name or "there"}! This code looks healthy.',
                'friendly_summary': 'Think of it like a car that passed inspection. All key measurements are in the safe zone.',
                'options': [
                    {'label': 'What made it safe?', 'action': 'explain_low'},
                    {'label': 'Show me the numbers', 'action': 'show_numbers'},
                    {'label': 'How do I keep it this way?', 'action': 'explain_prevent'}
                ]
            }
        
        # HIGH risk menu
        options = [
            {'label': 'Show me the biggest problem first', 'action': 'show_priority'},
            {'label': 'Show me all issues', 'action': 'show_all'},
            {'label': 'Explain what these numbers mean', 'action': 'explain_metrics'}
        ]
        
        return {
            'type': 'menu',
            'emoji': '⚠️',
            'text': f'We found some issues in the code, {session.user_name or "there"}. What would you like to do?',
            'friendly_summary': 'Think of this like a health checkup where the doctor found concerns. Don\'t panic — we\'ll tell you exactly what to fix and how.',
            'options': options,
            'tone': 'concerned_but_helpful'
        }

    def _build_feature_card(self, feat_name: str, metric_val: float, 
                           detail_level: str = 'full') -> dict:
        """Build a human-friendly feature explanation card."""
        if feat_name not in self.rules:
            return {
                'type': 'generic',
                'emoji': '❓',
                'text': f'I don\'t have specific advice for "{feat_name}" yet.',
                'friendly_tip': 'General rule: if you can\'t explain your code to a teammate in 30 seconds, it\'s probably too complex.'
            }
        
        r = self.rules[feat_name]
        threshold = r.get('threshold', 0)
        exceeded = metric_val > threshold
        how_bad = 'CRITICAL' if metric_val > threshold * 1.5 else 'WARNING' if exceeded else 'OK'
        
        card = {
            'type': 'advice',
            'feature': feat_name,
            'emoji': r.get('emoji', '⚠️'),
            'display_name': r['display_name'],
            'simple_explanation': r.get('simple_explanation', r.get('advice', '')),
            'your_score': round(metric_val, 2),
            'safe_limit': threshold,
            'exceeded': exceeded,
            'how_bad': how_bad,
            'severity_color': r.get('severity_color', 'orange'),
            'priority': r.get('priority', 2)
        }
        
        if detail_level == 'full':
            card.update({
                'analogy': r.get('analogy', ''),
                'why_care': r.get('why_care', ''),
                'real_impact': r.get('real_impact', ''),
                'fix_title': r.get('fix_title', 'How to Fix'),
                'fix_explanation': r.get('fix_explanation', r.get('advice', '')),
                'steps': r['steps'],
            })
        
        return card

    def _build_closing(self, session: ChatSession) -> dict:
        """Build conversation closing message."""
        return {
            'type': 'closing',
            'emoji': '👋',
            'text': f'All set, {session.user_name or "there"}!',
            'friendly_summary': 'You now know what to focus on. Tackle the 🔴 CRITICAL items first, then the 🟠 warnings if you have time.',
            'next_steps': [
                'Start with the highest priority issue',
                'Make one change at a time and re-run the analysis',
                'Ask a teammate to review your refactored code'
            ],
            'feedback_prompt': 'Was this helpful?',
            'feedback_options': ['Yes, very helpful', 'Somewhat helpful', 'I need a human expert']
        }

    # ── Core Response Handlers ──────────────────────────────────────

    def handle_greeting(self, session: ChatSession) -> dict:
        """Respond to greeting, then show menu."""
        messages = [{
            'type': 'greeting',
            'emoji': '👋',
            'text': f'Hi {session.user_name or "there"}! I\'m Veracity, your code health assistant.',
            'friendly_summary': 'I check your code for hidden risks and explain what to fix — no technical jargon, just clear advice.'
        }]
        messages.append(self._build_menu(session))
        return {
            'messages': messages,
            'quick_replies': self._get_quick_replies(session),
            'session_id': session.session_id
        }

    def handle_show_priority(self, session: ChatSession) -> dict:
        """Show the single most important issue."""
        if not session.top_features:
            return self._build_fallback(session, 'I don\'t see any issues to prioritize.')
        
        # Sort by priority (lower number = higher priority), then by SHAP value
        sorted_feats = sorted(
            session.top_features,
            key=lambda x: (self.rules.get(x['feature'], {}).get('priority', 99), 
                          -abs(x.get('shap_value', 0)))
        )
        
        top = sorted_feats[0]
        feat_name = top['feature']
        metric_val = top.get('metric_value', 0)
        
        session.features_seen.append(feat_name)
        session.current_menu = 'detail'
        
        card = self._build_feature_card(feat_name, metric_val, 'full')
        
        messages = [card]
        
        # Suggest next actions
        messages.append({
            'type': 'prompt',
            'emoji': '💡',
            'text': 'What would you like to do next?',
            'options': [
                {'label': 'Show me how to fix this', 'action': f'fix:{feat_name}'},
                {'label': 'Why does this matter?', 'action': f'why:{feat_name}'},
                {'label': 'Show me the next issue', 'action': 'show_priority'}
            ]
        })
        
        return {
            'messages': messages,
            'quick_replies': [
                f'Fix {card["emoji"]} {card["display_name"]}',
                'Why does this matter?',
                'Next issue',
                'Show all issues',
                'I\'m done'
            ],
            'session_id': session.session_id
        }

    def handle_show_all(self, session: ChatSession) -> dict:
        """Show all issues as a summary list."""
        if not session.top_features:
            return self._build_fallback(session, 'No issues found — everything looks good!')
        
        messages = [{
            'type': 'summary',
            'emoji': '📋',
            'text': f'Found {len(session.top_features)} areas needing attention:',
            'items': []
        }]
        
        for feat in session.top_features:
            name = feat['feature']
            val = feat.get('metric_value', 0)
            r = self.rules.get(name, {})
            threshold = r.get('threshold', 0)
            exceeded = val > threshold
            
            messages[0]['items'].append({
                'feature': name,
                'emoji': r.get('emoji', '⚠️'),
                'display_name': r.get('display_name', name),
                'your_score': round(val, 2),
                'safe_limit': threshold,
                'status': '🔴 CRITICAL' if val > threshold * 1.5 else '🟠 WARNING' if exceeded else '🟢 OK',
                'priority': r.get('priority', 2)
            })
        
        session.current_menu = 'summary'
        
        messages.append({
            'type': 'prompt',
            'text': 'Tap any issue above to learn more, or choose an action below.',
            'options': [
                {'label': 'Fix the biggest problem', 'action': 'show_priority'},
                {'label': 'Explain what these mean', 'action': 'explain_metrics'}
            ]
        })
        
        return {
            'messages': messages,
            'quick_replies': ['Fix biggest problem', 'Explain metrics', 'I\'m done'],
            'session_id': session.session_id
        }

    def handle_explain_metric(self, session: ChatSession, feat_name: str) -> dict:
        """Explain a specific metric in human terms."""
        # Find the metric value from session
        metric_val = 0
        for feat in session.top_features:
            if feat['feature'] == feat_name:
                metric_val = feat.get('metric_value', 0)
                break
        
        if feat_name not in self.rules:
            return self._build_fallback(session, f'I don\'t have an explanation for "{feat_name}" yet.')
        
        r = self.rules[feat_name]
        card = self._build_feature_card(feat_name, metric_val, 'full')
        
        messages = [card]
        
        # Add analogy if available
        if r.get('analogy'):
            messages.append({
                'type': 'analogy',
                'emoji': '🎯',
                'text': 'Here\'s a simple way to think about it:',
                'analogy_text': r['analogy']
            })
        
        messages.append({
            'type': 'prompt',
            'text': 'Want to see how to fix this, or explore another issue?',
            'options': [
                {'label': 'Show me the fix', 'action': f'fix:{feat_name}'},
                {'label': 'Why should I care?', 'action': f'why:{feat_name}'},
                {'label': 'Back to all issues', 'action': 'show_all'}
            ]
        })
        
        return {
            'messages': messages,
            'quick_replies': [
                f'Fix {r.get("emoji", "")} {r["display_name"]}',
                'Why should I care?',
                'Back to all issues',
                'I\'m done'
            ],
            'session_id': session.session_id
        }

    def handle_show_fix(self, session: ChatSession, feat_name: str) -> dict:
        """Show detailed fix steps for a specific feature."""
        metric_val = 0
        for feat in session.top_features:
            if feat['feature'] == feat_name:
                metric_val = feat.get('metric_value', 0)
                break
        
        if feat_name not in self.rules:
            return self._build_fallback(session, f'No fix guide for "{feat_name}".')
        
        r = self.rules[feat_name]
        
        messages = [{
            'type': 'fix_guide',
            'emoji': '🔧',
            'feature': feat_name,
            'display_name': r['display_name'],
            'fix_title': r.get('fix_title', 'How to Fix'),
            'fix_explanation': r.get('fix_explanation', r.get('advice', '')),
            'steps': [{'number': i+1, 'text': step} for i, step in enumerate(r['steps'])],
            'effort_estimate': '15-30 minutes' if r.get('priority', 2) == 1 else '30-60 minutes'
        }]
        
        messages.append({
            'type': 'prompt',
            'text': 'After you make these changes, re-run the analysis to see your improvement!',
            'options': [
                {'label': 'Show me another issue', 'action': 'show_priority'},
                {'label': 'I\'m done for now', 'action': 'closing'}
            ]
        })
        
        return {
            'messages': messages,
            'quick_replies': ['Another issue', 'I\'m done', 'Why does this matter?'],
            'session_id': session.session_id
        }

    def handle_why_care(self, session: ChatSession, feat_name: str) -> dict:
        """Explain why a specific metric matters."""
        if feat_name not in self.rules:
            return self._build_fallback(session, f'No details for "{feat_name}".')
        
        r = self.rules[feat_name]
        messages = []
        
        if r.get('why_care'):
            messages.append({
                'type': 'explanation',
                'emoji': '🤔',
                'title': 'Why This Matters',
                'text': r['why_care']
            })
        
        if r.get('real_impact'):
            messages.append({
                'type': 'explanation',
                'emoji': '📊',
                'title': 'Real Impact',
                'text': r['real_impact']
            })
        
        messages.append({
            'type': 'prompt',
            'text': 'Ready to fix it?',
            'options': [
                {'label': 'Show me the fix steps', 'action': f'fix:{feat_name}'},
                {'label': 'Show me another issue', 'action': 'show_priority'}
            ]
        })
        
        return {
            'messages': messages,
            'quick_replies': ['Show fix steps', 'Another issue', 'I\'m done'],
            'session_id': session.session_id
        }

    def handle_explain_metrics(self, session: ChatSession) -> dict:
        """Give a general explanation of what metrics mean."""
        messages = [{
            'type': 'explanation',
            'emoji': '📚',
            'title': 'What These Numbers Mean',
            'text': 'We measure three things: how complex your code is (Decision Overload), how hard it is to understand (Mental Marathon), and how likely it is to have bugs (Accident Waiting to Happen).',
            'sections': [
                {'title': '🍝 Decision Overload', 'text': 'Too many if/for/while paths. Like a maze with too many turns.'},
                {'title': '😵 Mental Marathon', 'text': 'Code is exhausting to read. Like a textbook with no chapters.'},
                {'title': '💣 Accident Waiting to Happen', 'text': 'Math predicts bugs. Like a smoke detector warning before the fire.'}
            ]
        }]
        
        if session.risk_level != 'LOW':
            messages.append({
                'type': 'prompt',
                'text': 'Want to see your specific issues now?',
                'options': [
                    {'label': 'Show biggest problem', 'action': 'show_priority'},
                    {'label': 'Show all issues', 'action': 'show_all'}
                ]
            })
        
        return {
            'messages': messages,
            'quick_replies': ['Show biggest problem', 'Show all issues', 'I\'m done'],
            'session_id': session.session_id
        }

    def handle_low_risk(self, session: ChatSession) -> dict:
        """Explain why code is low risk."""
        messages = [{
            'type': 'explanation',
            'emoji': '🛡️',
            'title': 'Why This Code is Safe',
            'text': 'All key measurements are below our safety thresholds. The code is well-organized, not too long, and doesn\'t have excessive branching.',
            'details': 'Specifically: complexity is low, effort to understand is reasonable, and the bug prediction is in the safe zone.'
        }]
        
        messages.append(self._build_menu(session))
        
        return {
            'messages': messages,
            'quick_replies': ['Show me the numbers', 'How do I keep it this way?', 'I\'m done'],
            'session_id': session.session_id
        }

    def handle_prevent(self, session: ChatSession) -> dict:
        """Give prevention tips."""
        messages = [{
            'type': 'explanation',
            'emoji': '✨',
            'title': 'How to Keep Code Healthy',
            'text': 'Prevention is easier than cure. Here are habits that keep your code in the green zone:',
            'tips': [
                'Keep functions under 20 lines when possible',
                'Add a comment explaining WHY, not just WHAT',
                'Write a test for every bug you fix',
                'Review code with a teammate before merging',
                'Re-run analysis before every release'
            ]
        }]
        
        return {
            'messages': messages,
            'quick_replies': ['Analyze another file', 'I\'m done'],
            'session_id': session.session_id
        }

    def handle_numbers(self, session: ChatSession) -> dict:
        """Show raw metric numbers in a friendly way."""
        if not session.top_features:
            return {
                'messages': [{
                    'type': 'data',
                    'emoji': '📊',
                    'text': 'No metrics available.',
                }],
                'quick_replies': ['I\'m done'],
                'session_id': session.session_id
            }
        
        items = []
        for feat in session.top_features:
            name = feat['feature']
            val = feat.get('metric_value', 0)
            r = self.rules.get(name, {})
            threshold = r.get('threshold', 0)
            items.append({
                'feature': name,
                'display_name': r.get('display_name', name),
                'your_value': round(val, 2),
                'safe_limit': threshold,
                'unit': 'points' if name in ['v(g)', 'e', 'v', 'loc'] else 'ratio',
                'status': 'over' if val > threshold else 'under'
            })
        
        messages = [{
            'type': 'data',
            'emoji': '📊',
            'text': 'Here are your numbers compared to safe limits:',
            'items': items
        }]
        
        return {
            'messages': messages,
            'quick_replies': ['What do these mean?', 'Show me fixes', 'I\'m done'],
            'session_id': session.session_id
        }

    def handle_closing(self, session: ChatSession) -> dict:
        """End conversation gracefully."""
        closing = self._build_closing(session)
        session.current_menu = 'closed'
        return {
            'messages': [closing],
            'quick_replies': ['Analyze another file', 'Download report', 'Exit'],
            'session_id': session.session_id,
            'conversation_complete': True
        }

    def _build_fallback(self, session: ChatSession, reason: str) -> dict:
        """Graceful fallback when something goes wrong."""
        return {
            'messages': [{
                'type': 'fallback',
                'emoji': '🤔',
                'text': reason,
                'friendly_tip': 'I\'m like a calculator — I know my buttons, but freeform chat isn\'t my strong suit.',
                'suggested_actions': [
                    {'label': 'Show main menu', 'action': 'show_menu'},
                    {'label': 'Show all issues', 'action': 'show_all'},
                    {'label': 'I\'m done', 'action': 'closing'}
                ]
            }],
            'quick_replies': ['Show menu', 'Show all issues', 'I\'m done'],
            'session_id': session.session_id
        }

    def _get_quick_replies(self, session: ChatSession) -> List[str]:
        """Generate context-aware quick replies."""
        if session.current_menu == 'closed':
            return ['Analyze another file', 'Download report']
        if session.risk_level == 'LOW':
            return ['What made it safe?', 'Show me the numbers', 'How do I keep it this way?', 'I\'m done']
        if session.current_menu == 'detail':
            return ['Show fix steps', 'Why does this matter?', 'Next issue', 'Show all issues', 'I\'m done']
        return ['Show biggest problem', 'Show all issues', 'Explain metrics', 'I\'m done']

    # ── Main Entry Point (Conversational) ───────────────────────────

    def chat(self, session_id: str, user_message: str, risk_level: str = None,
             top_features: List[Dict] = None, user_name: str = None) -> dict:
        """
        Main conversational entry point.
        Call this for every user message in the chat.
        """
        session = self.get_or_create_session(session_id, risk_level, top_features)
        session.conversation_turn += 1
        
        if user_name:
            session.user_name = user_name
        
        # If this is the first message and we have analysis data, initialize
        if risk_level and top_features and session.conversation_turn == 1:
            session.risk_level = risk_level
            session.top_features = top_features
        
        intent = self.detect_intent(user_message)
        
        # Route to handler
        handlers = {
            'greeting': self.handle_greeting,
            'show_priority': self.handle_show_priority,
            'show_all': self.handle_show_all,
            'explain_vg': lambda s: self.handle_explain_metric(s, 'v(g)'),
            'explain_e': lambda s: self.handle_explain_metric(s, 'e'),
            'explain_b': lambda s: self.handle_explain_metric(s, 'b'),
            'explain_v': lambda s: self.handle_explain_metric(s, 'v'),
            'explain_d': lambda s: self.handle_explain_metric(s, 'd'),
            'explain_loc': lambda s: self.handle_explain_metric(s, 'loc'),
            'explain_branchcount': lambda s: self.handle_explain_metric(s, 'branchcount'),
            'explain_v_density': lambda s: self.handle_explain_metric(s, 'v_density'),
            'explain_ev_ratio': lambda s: self.handle_explain_metric(s, 'ev_ratio'),
            'explain_metrics': self.handle_explain_metrics,
            'explain_low': self.handle_low_risk,
            'explain_prevent': self.handle_prevent,
            'show_numbers': self.handle_numbers,
            'show_menu': lambda s: {'messages': [self._build_menu(s)], 'quick_replies': self._get_quick_replies(s), 'session_id': s.session_id},
            'closing': self.handle_closing,
        }
        
        # Handle fix: and why: prefixed intents
        if user_message.startswith('fix:'):
            return self.handle_show_fix(session, user_message.replace('fix:', ''))
        if user_message.startswith('why:'):
            return self.handle_why_care(session, user_message.replace('why:', ''))
        
        handler = handlers.get(intent, None)
        
        if handler:
            return handler(session)
        else:
            return self._build_fallback(session, f'I\'m not sure I understood "{user_message}".')

    # ── Legacy Compatibility Wrapper ────────────────────────────────

    def get_advice(self, top_features: List[Dict], risk_level: str) -> dict:
        """
        Legacy wrapper for main.py compatibility.
        Returns the same format as the OLD chatbot: {messages: [...], quick_replies: [...]}
        """
        session_id = f"legacy_{id(self)}"
        session = self.get_or_create_session(session_id, risk_level, top_features)
        session.risk_level = risk_level  # Ensure it's set correctly
        session.top_features = top_features
        
        # Build the proper legacy response format
        menu = self._build_menu(session)
        
        # Convert to old format expected by main.py and tests
        messages = [menu]
        quick_replies = []
        
        if risk_level == 'LOW':
            quick_replies = ['What kept the risk low?', 'Show me the numbers', 'How do I keep it this way?']
        else:
            # HIGH risk — build quick replies from actual features
            for feat in top_features:
                name = feat.get('feature')
                if name in self.rules:
                    r = self.rules[name]
                    quick_replies.append(f"How to fix {r['display_name']}?")
            
            # Add system header message for HIGH risk (old format compatibility)
            messages.insert(0, {
                'type': 'system',
                'text': f'⚠️  This module is HIGH RISK. Here is your action plan:'
            })
            
            # Add advice cards for each feature (old format)
            for feat in top_features:
                name = feat.get('feature')
                if name not in self.rules:
                    continue
                r = self.rules[name]
                metric_val = feat.get('metric_value', 0)
                threshold = r.get('threshold', 0)
                exceeded = metric_val > threshold
                
                messages.append({
                    'type': 'advice',
                    'feature': name,
                    'display_name': r['display_name'],
                    'metric_value': round(metric_val, 4),
                    'threshold': threshold,
                    'exceeded': exceeded,
                    'text': r.get('advice', r.get('simple_explanation', '')),
                    'steps': r['steps'],
                    'priority': r.get('priority', 2)
                })
        
        return {
            'messages': messages,
            'quick_replies': quick_replies[:4]
        }


# ── Legacy Wrapper for main.py ─────────────────────────────────────

_chatbot_instance = None

def get_mitigation_advice(features_dict, feature_names, shap_values_dict):
    """
    Legacy wrapper used by main.py analyze endpoint.
    Returns initial conversational payload.
    """
    global _chatbot_instance
    if _chatbot_instance is None:
        _chatbot_instance = ChatbotService()
    
    top_features = []
    for name in feature_names:
        if name in shap_values_dict:
            top_features.append({
                'feature': name,
                'shap_value': shap_values_dict[name],
                'metric_value': features_dict.get(name, 0)
            })
    
    top_features.sort(key=lambda x: abs(x['shap_value']), reverse=True)
    return _chatbot_instance.get_advice(top_features[:5], 'HIGH')


# ── Standalone Test ─────────────────────────────────────────────────

if __name__ == "__main__":
    # Smart path detection
    _BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    _SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
    
    possible_paths = [
        os.path.join(_SERVICE_DIR, 'mitigation_rules_human.json'),
        os.path.join(_BASE, 'mitigation_rules_human.json'),
        os.path.join(_BASE, 'services', 'mitigation_rules_human.json'),
        os.path.join(os.getcwd(), 'mitigation_rules_human.json'),
        os.path.join(_SERVICE_DIR, 'mitigation_rules.json'),
        os.path.join(_BASE, 'mitigation_rules.json'),
    ]
    
    rules_path = None
    for path in possible_paths:
        if os.path.exists(path):
            rules_path = path
            break
    
    chatbot = ChatbotService(rules_path)
    
    print("\n=== TEST 1: LOW RISK (Legacy) ===")
    result = chatbot.get_advice([], 'LOW')
    print(json.dumps(result, indent=2))
    
    print("\n=== TEST 2: HIGH RISK - Initial Menu (Legacy) ===")
    sample_features = [
        {'feature': 'v(g)', 'shap_value': 0.85, 'metric_value': 15.5},
        {'feature': 'e', 'shap_value': 0.62, 'metric_value': 12500.0},
        {'feature': 'b', 'shap_value': 0.45, 'metric_value': 3.2},
    ]
    result = chatbot.get_advice(sample_features, 'HIGH')
    print(json.dumps(result, indent=2))
    
    print("\n=== TEST 3: CONVERSATIONAL FLOW ===")
    session_id = "test_session_001"
    
    # Turn 1: Greeting
    print("\n--- Turn 1: User says 'hi' ---")
    resp = chatbot.chat(session_id, "hi", risk_level='HIGH', top_features=sample_features, user_name='Alex')
    print(f"Bot: {resp['messages'][0]['text'][:60]}...")
    print(f"Quick replies: {resp['quick_replies']}")
    
    # Turn 2: Show priority
    print("\n--- Turn 2: User says 'show me the biggest problem' ---")
    resp = chatbot.chat(session_id, "show me the biggest problem")
    print(f"Bot: {resp['messages'][0]['display_name']} - {resp['messages'][0]['simple_explanation'][:60]}...")
    print(f"Quick replies: {resp['quick_replies']}")
    
    # Turn 3: Show fix
    print("\n--- Turn 3: User says 'fix:v(g)' ---")
    resp = chatbot.chat(session_id, "fix:v(g)")
    print(f"Bot: {resp['messages'][0]['fix_title']} - {len(resp['messages'][0]['steps'])} steps")
    print(f"Quick replies: {resp['quick_replies']}")
    
    # Turn 4: Done
    print("\n--- Turn 4: User says 'thanks, done' ---")
    resp = chatbot.chat(session_id, "thanks, done")
    print(f"Bot: {resp['messages'][0]['text']}")
    print(f"Conversation complete: {resp.get('conversation_complete', False)}")