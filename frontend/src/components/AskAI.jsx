import React, { useState } from 'react';
import { askAI } from '../api';
import './AskAI.css';

function AskAI() {
    const [question, setQuestion] = useState('');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const res = await askAI(question);
            setResponse(res);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ask-ai-container">
            <h2>Daten abfragen (KI)</h2>
            <form onSubmit={handleSubmit} className="ai-form">
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Stellen Sie eine Frage zu den Fahrplandaten (z.B. 'Wie viele Linien gibt es?')"
                    className="ai-input"
                />
                <button type="submit" disabled={loading} className="ai-button">
                    {loading ? 'Frage KI...' : 'Fragen'}
                </button>
            </form>

            {error && <div className="error-message">{error}</div>}

            {response && (
                <div className="ai-response">
                    <p className="ai-answer">{response.answer}</p>
                    {response.data && response.data.length > 0 && (
                        <div className="table-container">
                            <table className="ai-table">
                                <thead>
                                    <tr>
                                        {Object.keys(response.data[0]).map((key) => (
                                            <th key={key}>{key}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {response.data.map((row, i) => (
                                        <tr key={i}>
                                            {Object.values(row).map((val, j) => (
                                                <td key={j}>{val}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <details>
                        <summary>SQL anzeigen</summary>
                        <pre>{response.sql}</pre>
                    </details>
                </div>
            )}
        </div>
    );
}

export default AskAI;
