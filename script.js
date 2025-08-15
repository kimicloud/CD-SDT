
let currentTool = null;

function showTool(toolName) {

    const tools = document.querySelectorAll('.tool-interface');
    tools.forEach(tool => tool.classList.add('hidden'));
    
    const selectedTool = document.getElementById(toolName + '-tool');
    if (selectedTool) {
        selectedTool.classList.remove('hidden');
        selectedTool.classList.add('fade-in');
        currentTool = toolName;
        
        selectedTool.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Expression Evaluator Functions
function evaluateExpression() {
    const input = document.getElementById('expression-input');
    const expression = input.value.trim();
    
    if (!expression) {
        showMessage('Please enter an arithmetic expression.', 'error');
        return;
    }
    
    try {
        const solution = generateSDTSolution(expression);
        displayExpressionResults(solution);
    } catch (error) {
        showMessage('Error processing expression: ' + error.message, 'error');
    }
}

function generateSDTSolution(expression) {
    // Clean the expression
    const cleanExpression = expression.replace(/\s+/g, '');
    
    // Determine operators
    const operators = findOperators(cleanExpression);
    
    // Generate components
    const cfg = generateCFG(operators);
    const parseTree = generateVisualParseTree(cleanExpression);
    const semanticRules = generateSemanticRules(operators);
    const evaluation = evaluateArithmeticExpression(cleanExpression);
    
    return {
        expression: cleanExpression,
        cfg: cfg,
        parseTree: parseTree,
        semanticRules: semanticRules,
        evaluation: evaluation
    };
}

function findOperators(expression) {
    const operators = new Set();
    for (let i = 0; i < expression.length; i++) {
        const char = expression[i];
        if ('+-*/^()'.includes(char)) {
            operators.add(char);
        }
        // Check for ** (exponentiation)
        if (char === '*' && i + 1 < expression.length && expression[i + 1] === '*') {
            operators.add('**');
            if (operators.has('*')) {
                operators.delete('*');
            }
        }
    }
    return operators;
}

function generateCFG(operators) {
    let productions = [];
    
    if (operators.has('**') || operators.has('^')) {
        productions.push('E → E + T | E - T | T');
        productions.push('T → T * F | T / F | F');
        productions.push('F → P ** F | P');
        productions.push('P → ( E ) | digit');
    } else {
        productions.push('E → E + T | E - T | T');
        productions.push('T → T * F | T / F | F');
        productions.push('F → ( E ) | digit');
    }
    
    // Adjust based on actual operators
    if (!operators.has('+') && !operators.has('-')) {
        productions[0] = 'E → T';
    } else if (operators.has('+') && !operators.has('-')) {
        productions[0] = 'E → E + T | T';
    } else if (!operators.has('+') && operators.has('-')) {
        productions[0] = 'E → E - T | T';
    }
    
    if (!operators.has('*') && !operators.has('/') && !operators.has('**')) {
        productions[1] = 'T → F';
    } else if (operators.has('*') && !operators.has('/')) {
        productions[1] = 'T → T * F | F';
    } else if (!operators.has('*') && operators.has('/')) {
        productions[1] = 'T → T / F | F';
    }
    
    productions.push('digit → 0 | 1 | 2 | ... | 9 | digit digit');
    
    return productions.join('\n');
}

function generateVisualParseTree(expression) {
    // Simplified parse tree generation
    if (expression.includes('**')) {
        if (expression.includes('+')) {
            const parts = expression.split('+');
            const left = parts[0];
            const right = parts.slice(1).join('+');
            const expParts = right.split('**');
            const base = expParts[0];
            const power = expParts.slice(1).join('**');
            
            return `
                E
               /|\\
              E + T
              |   |
              T   F
              |  /|\\
              F P**F
              | |  |
           digit digit digit
            (${left}) (${base}) (${power})`;
        } else {
            const parts = expression.split('**');
            const base = parts[0];
            const power = parts.slice(1).join('**');
            
            return `
                E
                |
                T
                |
                F
               /|\\
              P **F
              |   |
           digit digit
            (${base}) (${power})`;
        }
    } else if (expression.includes('*')) {
        if (expression.includes('+')) {
            const parts = expression.split('+');
            const left = parts[0];
            const right = parts.slice(1).join('+');
            const mulParts = right.split('*');
            const factor1 = mulParts[0];
            const factor2 = mulParts.slice(1).join('*');
            
            return `
                E
               /|\\
              E + T
              |  /|\\
              T T * F
              | |   |
              F F digit
              | |  (${factor2})
           digit digit
            (${left}) (${factor1})`;
        } else {
            const parts = expression.split('*');
            const factor1 = parts[0];
            const factor2 = parts.slice(1).join('*');
            
            return `
                E
                |
                T
               /|\\
              T * F
              |   |
              F digit
              |  (${factor2})
           digit
            (${factor1})`;
        }
    } else if (expression.includes('+')) {
        const parts = expression.split('+');
        const left = parts[0];
        const right = parts.slice(1).join('+');
        
        return `
            E
           /|\\
          E + T
          |   |
          T   F
          |   |
          F digit
          |  (${right})
       digit
        (${left})`;
    } else {
        return `
            E
            |
            T
            |
            F
            |
         digit
          (${expression})`;
    }
}

function generateSemanticRules(operators) {
    const rules = [];
    
    // E rules
    if (operators.has('+') || operators.has('-')) {
        if (operators.has('+')) {
            rules.push('E.val = E₁.val + T.val  [for E → E₁ + T]');
        }
        if (operators.has('-')) {
            rules.push('E.val = E₁.val - T.val  [for E → E₁ - T]');
        }
        rules.push('E.val = T.val  [for E → T]');
    } else {
        rules.push('E.val = T.val');
    }
    
    // T rules
    if (operators.has('*') || operators.has('/')) {
        if (operators.has('*') && !operators.has('**')) {
            rules.push('T.val = T₁.val * F.val  [for T → T₁ * F]');
        }
        if (operators.has('/')) {
            rules.push('T.val = T₁.val / F.val  [for T → T₁ / F]');
        }
        rules.push('T.val = F.val  [for T → F]');
    } else {
        rules.push('T.val = F.val');
    }
    
    // F rules
    if (operators.has('**') || operators.has('^')) {
        if (operators.has('**')) {
            rules.push('F.val = P.val ** F₁.val  [for F → P ** F₁]');
        } else if (operators.has('^')) {
            rules.push('F.val = P.val ^ F₁.val  [for F → P ^ F₁]');
        }
        rules.push('F.val = P.val  [for F → P]');
        rules.push('P.val = E.val  [for P → ( E )]');
        rules.push('P.val = digit.lexval  [for P → digit]');
    } else {
        rules.push('F.val = E.val  [for F → ( E )]');
        rules.push('F.val = digit.lexval  [for F → digit]');
    }
    
    rules.push('digit.lexval = numerical value of the digit');
    
    return rules.join('\n');
}

function evaluateArithmeticExpression(expression) {
    try {
        // Replace ^ with ** for evaluation
        const expr = expression.replace(/\^/g, '**');
        
        // Use Function constructor for safer evaluation
        const result = new Function('return ' + expr)();
        return result;
    } catch (error) {
        return 'Error in evaluation: ' + error.message;
    }
}

function displayExpressionResults(solution) {
    const resultsDiv = document.getElementById('expression-results');
    
    resultsDiv.innerHTML = `
        <div class="result-card">
            <h3>Complete S-SDT Solution for: ${solution.expression}</h3>
        </div>
        
        <div class="result-card">
            <h3>Step 1: Context-Free Grammar</h3>
            <pre>${solution.cfg}</pre>
        </div>
        
        <div class="result-card">
            <h3>Step 2: Parse Tree</h3>
            <pre>${solution.parseTree}</pre>
        </div>
        
        <div class="result-card">
            <h3>Step 3: Semantic Rules</h3>
            <pre>${solution.semanticRules}</pre>
        </div>
        
        <div class="result-card">
            <h3>Step 4: Final Result</h3>
            <div style="font-size: 18px; font-weight: 600; color: var(--primary-green); padding: 20px; background: var(--mint); border-radius: 8px; text-align: center;">
                ${solution.expression} = ${solution.evaluation}
            </div>
        </div>
    `;
    
    resultsDiv.classList.add('fade-in');
}

// SDT Rules Analyzer Functions
function addGrammarRule() {
    const textarea = document.getElementById('grammar-input');
    const currentValue = textarea.value;
    const newRule = prompt('Enter new grammar production:');
    
    if (newRule && newRule.trim()) {
        textarea.value = currentValue + (currentValue ? '\n' : '') + newRule.trim();
    }
}

function addSemanticRule() {
    const textarea = document.getElementById('rules-input');
    const currentValue = textarea.value;
    const newRule = prompt('Enter new semantic rule:');
    
    if (newRule && newRule.trim()) {
        textarea.value = currentValue + (currentValue ? '\n' : '') + newRule.trim();
    }
}

function analyzeRules() {
    const grammarInput = document.getElementById('grammar-input');
    const rulesInput = document.getElementById('rules-input');
    
    const grammar = grammarInput.value.trim().split('\n').filter(line => line.trim());
    const rules = rulesInput.value.trim().split('\n').filter(line => line.trim());
    
    if (!grammar.length) {
        showMessage('Please enter grammar productions.', 'error');
        return;
    }
    
    if (!rules.length) {
        showMessage('Please enter semantic rules.', 'error');
        return;
    }
    
    const analysis = performSDTAnalysis(grammar, rules);
    displayRulesResults(grammar, rules, analysis);
}

function performSDTAnalysis(grammar, rules) {
    const analysis = [];
    const inheritedPattern = /\.i\s*=/;
    
    rules.forEach((rule, index) => {
        const isInherited = inheritedPattern.test(rule);
        
        analysis.push({
            rule: rule,
            ruleNumber: index + 1,
            isSDT: !isInherited,
            explanation: isInherited 
                ? 'This rule contains inherited attributes (.i), making it L-attributed rather than S-attributed.'
                : 'This rule contains only synthesized attributes, making it S-attributed.'
        });
    });
    
    return analysis;
}

function displayRulesResults(grammar, rules, analysis) {
    const resultsDiv = document.getElementById('rules-results');
    
    const isAllSDT = analysis.every(item => item.isSDT);
    const summaryClass = isAllSDT ? 's-attributed' : 'not-s-attributed';
    const summaryText = isAllSDT ? 'S-Attributed SDT' : 'L-Attributed SDT';
    
    let grammarHTML = grammar.map(prod => `<div>${prod}</div>`).join('');
    
    let analysisHTML = analysis.map(item => `
        <div class="analysis-result ${item.isSDT ? 's-attributed' : 'not-s-attributed'}">
            <div class="rule-title">Rule ${item.ruleNumber}</div>
            <div class="rule-text">${item.rule}</div>
            <div class="result-label ${item.isSDT ? 's-attributed' : 'not-s-attributed'}">
                ${item.isSDT ? 'S-Attributed' : 'L-Attributed'}
            </div>
            <div>${item.explanation}</div>
        </div>
    `).join('');
    
    resultsDiv.innerHTML = `
        <div class="result-card">
            <h3>Analysis Summary</h3>
            <div style="text-align: center; padding: 20px;">
                <div class="result-label ${summaryClass}" style="font-size: 16px; padding: 12px 24px;">
                    ${summaryText}
                </div>
                <p style="margin-top: 16px; color: var(--medium-gray);">
                    ${isAllSDT 
                        ? 'All rules use only synthesized attributes - perfect for bottom-up evaluation!'
                        : 'Some rules use inherited attributes - requires left-to-right evaluation.'
                    }
                </p>
            </div>
        </div>
        
        <div class="result-card">
            <h3>Given Grammar</h3>
            <pre>${grammarHTML}</pre>
        </div>
        
        <div class="result-card">
            <h3>Rule-by-Rule Analysis</h3>
            ${analysisHTML}
        </div>
        
        <div class="result-card">
            <h3>Understanding the Results</h3>
            <div style="background: var(--mint); padding: 20px; border-radius: 8px; border: 1px solid var(--pale-green);">
                <p><strong>S-Attributed SDT:</strong> Uses only synthesized attributes that flow bottom-up in the parse tree. Perfect for shift-reduce parsers.</p>
                <p style="margin-top: 12px;"><strong>L-Attributed SDT:</strong> Uses both synthesized and inherited attributes. Inherited attributes flow from parent to children or left-to-right between siblings.</p>
            </div>
        </div>
    `;
    
    resultsDiv.classList.add('fade-in');
}

// Utility Functions
function showMessage(message, type = 'info') {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1001;
        opacity: 0;
        transform: translateX(100px);
        transition: all 0.3s ease;
    `;
    
    if (type === 'error') {
        messageDiv.style.backgroundColor = '#dc3545';
    } else {
        messageDiv.style.backgroundColor = 'var(--accent-green)';
    }
    
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateX(100px)';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    document.getElementById('expression-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            evaluateExpression();
        }
    });
    
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(45, 90, 45, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });
});