// Main JavaScript for Resume Lift Application

// Wait for the document to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // File Upload Handling
    const dropZone = document.getElementById('upload-area');
    const fileInput = document.getElementById('resume-upload');
    const browseBtn = document.getElementById('browse-btn');
    const processingDiv = document.getElementById('processing');
    const resultsSection = document.getElementById('results-section');
    const heroSection = document.querySelector('.hero-section');
    const howItWorksSection = document.getElementById('how-it-works');
    const faqSection = document.getElementById('faq');
    const tipsSection = document.getElementById('tips');
    const tryAnotherBtn = document.getElementById('try-another-btn');
    const copyFeedbackBtn = document.getElementById('copy-feedback-btn');
    const downloadReportBtn = document.getElementById('download-report-btn');
    const sampleResumeLink = document.getElementById('sample-resume');
    
    // API Key Elements
    const useCustomApiKeyCheckbox = document.getElementById('useCustomApiKey');
    const apiKeyContainer = document.getElementById('apiKeyContainer');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const toggleApiKeyVisibilityBtn = document.getElementById('toggleApiKeyVisibility');

    // Store feedback data for later use
    let currentFeedback = null;
    
    // API Key Management
    const API_KEY_STORAGE_KEY = 'resumeLiftApiKey';
    let isApiKeyVisible = false;

    // Initialize API key from localStorage if available
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedApiKey) {
        useCustomApiKeyCheckbox.checked = true;
        apiKeyContainer.classList.remove('d-none');
        apiKeyInput.value = savedApiKey;
    }

    // Toggle API key visibility
    if (toggleApiKeyVisibilityBtn) {
        toggleApiKeyVisibilityBtn.addEventListener('click', function() {
            isApiKeyVisible = !isApiKeyVisible;
            apiKeyInput.type = isApiKeyVisible ? 'text' : 'password';
            toggleApiKeyVisibilityBtn.innerHTML = isApiKeyVisible ? 
                '<i class="fas fa-eye-slash"></i>' : 
                '<i class="fas fa-eye"></i>';
            toggleApiKeyVisibilityBtn.setAttribute('title', isApiKeyVisible ? 'Hide API key' : 'Show API key');
        });
    }

    // Toggle API key input field
    if (useCustomApiKeyCheckbox) {
        useCustomApiKeyCheckbox.addEventListener('change', function() {
            if (this.checked) {
                apiKeyContainer.classList.remove('d-none');
                // Save the API key when toggling on
                if (apiKeyInput.value) {
                    localStorage.setItem(API_KEY_STORAGE_KEY, apiKeyInput.value);
                }
            } else {
                apiKeyContainer.classList.add('d-none');
                // Clear saved API key when toggling off
                localStorage.removeItem(API_KEY_STORAGE_KEY);
            }
        });
    }

    // Save API key when it changes
    if (apiKeyInput) {
        apiKeyInput.addEventListener('change', function() {
            if (useCustomApiKeyCheckbox.checked && this.value) {
                localStorage.setItem(API_KEY_STORAGE_KEY, this.value);
            } else {
                localStorage.removeItem(API_KEY_STORAGE_KEY);
            }
        });
    }

    // Get the current API key based on user selection
    function getApiKey() {
        if (useCustomApiKeyCheckbox.checked && apiKeyInput.value) {
            return apiKeyInput.value.trim();
        }
        return null; // Will use server-side default if null
    }

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        if (dropZone) {
            dropZone.addEventListener(eventName, preventDefaults, false);
        }
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        if (dropZone) {
            dropZone.addEventListener(eventName, highlight, false);
        }
    });

    ['dragleave', 'drop'].forEach(eventName => {
        if (dropZone) {
            dropZone.addEventListener(eventName, unhighlight, false);
        }
    });

    // Handle dropped files
    if (dropZone) {
        dropZone.addEventListener('drop', handleDrop, false);
    }
    
    // Trigger file input when browse button is clicked
    if (browseBtn && fileInput) {
        browseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            fileInput.click();
        });
    }

    // Handle file selection via file input
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect, false);
    }

    // Handle sample resume link
    if (sampleResumeLink) {
        sampleResumeLink.addEventListener('click', function(e) {
            e.preventDefault();
            processSampleResume();
        });
    }

    // Handle "Try Another Resume" button
    if (tryAnotherBtn) {
        tryAnotherBtn.addEventListener('click', resetForm);
    }

    // Handle "Copy Feedback" button
    if (copyFeedbackBtn) {
        copyFeedbackBtn.addEventListener('click', copyFeedbackToClipboard);
    }

    // Handle "Download Report" button
    if (downloadReportBtn) {
        downloadReportBtn.addEventListener('click', downloadFeedbackReport);
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        // Skip if it's a dropdown toggle
        if (anchor.classList.contains('dropdown-toggle')) {
            return;
        }
        
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Prevent default drag behaviors
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop zone
    function highlight() {
        dropZone.classList.add('bg-light', 'border-primary');
    }

    // Remove highlight from drop zone
    function unhighlight() {
        dropZone.classList.remove('bg-light', 'border-primary');
    }

    // Handle dropped files
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    // Handle file selection
    function handleFileSelect(e) {
        const files = e.target.files || e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    }

    // Process the selected file
    function processFile(file) {
        // Check file size (2MB max)
        const maxSize = 2 * 1024 * 1024; // 2MB in bytes
        if (file.size > maxSize) {
            showAlert('File is too large. Maximum file size is 2MB.', 'danger');
            return;
        }

        // Check file type
        const fileType = file.name.split('.').pop().toLowerCase();
        if (!['pdf', 'txt', 'docx'].includes(fileType)) {
            showAlert('Invalid file type. Please upload a PDF, TXT, or DOCX file.', 'danger');
            return;
        }

        // Show processing state
        showProcessing(true);

        // Create form data
        const formData = new FormData();
        formData.append('resume', file);
        
        // Add API key to the request if provided
        const apiKey = getApiKey();
        if (apiKey) {
            formData.append('api_key', apiKey);
        }

        // Send file to server
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentFeedback = data.feedback;
                displayFeedback(data.feedback);
            } else {
                throw new Error(data.error || 'An error occurred while processing your resume.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert(error.message || 'An error occurred. Please try again.', 'danger');
        })
        .finally(() => {
            showProcessing(false);
            // Reset file input
            if (fileInput) fileInput.value = '';
        });
    }

    // Process sample resume
    function processSampleResume() {
        showProcessing(true);
        
        // Add API key to the request if provided
        const apiKey = getApiKey();
        const url = apiKey ? `/sample?api_key=${encodeURIComponent(apiKey)}` : '/sample';
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    currentFeedback = data.feedback;
                    displayFeedback(data.feedback);
                } else {
                    throw new Error(data.error || 'Failed to load sample feedback.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert(error.message || 'Failed to load sample feedback. Please try again.', 'danger');
            })
            .finally(() => {
                showProcessing(false);
            });
    }

    // Display feedback to the user
    function displayFeedback(feedback) {
        // Hide upload section, show results
        if (heroSection) heroSection.classList.add('d-none');
        if (howItWorksSection) howItWorksSection.classList.add('d-none');
        if (faqSection) faqSection.classList.add('d-none');
        if (tipsSection) tipsSection.classList.add('d-none');
        
        if (resultsSection) {
            resultsSection.classList.remove('d-none');
            
            // Scroll to top
            window.scrollTo(0, 0);
            
            // Update overall score
            const overallScore = feedback.scores.overall;
            const percentage = Math.round((overallScore / 5) * 100);
            
            // Animate score circle
            const circleFill = document.querySelector('.circle-fill');
            if (circleFill) {
                circleFill.style.strokeDasharray = `${percentage}, 100`;
            }
            
            const scorePercentage = document.querySelector('.score-percentage');
            if (scorePercentage) {
                scorePercentage.textContent = `${percentage}%`;
            }
            
            // Update overall summary
            const overallSummary = document.getElementById('overall-summary');
            if (overallSummary) {
                overallSummary.textContent = feedback.summary || 'No summary available.';
            }
            
            // Update score breakdown
            updateScoreBreakdown(feedback.scores);
            
            // Update strengths
            updateList('strengths-list', feedback.strengths || [], 'check', 'success');
            
            // Update suggestions
            updateList('suggestions-list', feedback.suggestions || [], 'arrow-right', 'primary');
            
            // Store feedback for downloading
            if (downloadReportBtn) {
                downloadReportBtn.dataset.feedback = JSON.stringify(feedback);
            }
        }
    }

    // Update score breakdown
    function updateScoreBreakdown(scores) {
        const scoreBreakdown = document.getElementById('score-breakdown');
        if (!scoreBreakdown) return;
        
        scoreBreakdown.innerHTML = '';
        
        Object.entries(scores).forEach(([category, score]) => {
            if (category !== 'overall') {
                const percentage = Math.round((score / 5) * 100);
                const scoreItem = document.createElement('div');
                scoreItem.className = 'score-item';
                scoreItem.innerHTML = `
                    <div class="d-flex justify-content-between mb-1">
                        <span class="score-label">${category.charAt(0).toUpperCase() + category.slice(1)}</span>
                        <span class="text-muted small">${score}/5</span>
                    </div>
                    <div class="score-bar">
                        <div class="score-progress" style="width: ${percentage}%" data-width="${percentage}"></div>
                    </div>
                `;
                scoreBreakdown.appendChild(scoreItem);
            }
        });
        
        // Animate the progress bars
        setTimeout(() => {
            document.querySelectorAll('.score-progress').forEach(progress => {
                const width = progress.dataset.width || '0';
                progress.style.width = `${width}%`;
            });
        }, 100);
    }

    // Update a list with items
    function updateList(listId, items, iconClass, iconColor) {
        const list = document.getElementById(listId);
        if (!list) return;
        
        list.innerHTML = '';
        
        if (items && items.length > 0) {
            items.forEach(item => {
                const li = document.createElement('li');
                li.className = 'mb-2';
                li.innerHTML = `<i class="fas fa-${iconClass} text-${iconColor} me-2"></i>${item}`;
                list.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.className = 'text-muted';
            li.textContent = listId.includes('strengths') ? 'No specific strengths identified.' : 'No specific suggestions available.';
            list.appendChild(li);
        }
    }

    // Show processing state
    function showProcessing(show) {
        if (processingDiv) {
            processingDiv.classList.toggle('d-none', !show);
        }
        if (dropZone) {
            dropZone.style.opacity = show ? '0.5' : '1';
            dropZone.style.pointerEvents = show ? 'none' : 'auto';
        }
        if (browseBtn) {
            browseBtn.disabled = show;
        }
    }

    // Show alert message
    function showAlert(message, type = 'info') {
        // Remove any existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Insert the alert at the top of the main content
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.insertBefore(alertDiv, mainContent.firstChild);
        }
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }, 5000);
    }

    // Reset the form
    function resetForm() {
        // Show upload section, hide results
        if (heroSection) heroSection.classList.remove('d-none');
        if (howItWorksSection) howItWorksSection.classList.remove('d-none');
        if (faqSection) faqSection.classList.remove('d-none');
        if (tipsSection) tipsSection.classList.remove('d-none');
        
        if (resultsSection) {
            resultsSection.classList.add('d-none');
        }
        
        // Reset file input
        if (fileInput) fileInput.value = '';
        
        // Scroll to top
        window.scrollTo(0, 0);
    }

    // Copy feedback to clipboard
    function copyFeedbackToClipboard() {
        if (!currentFeedback) return;
        
        // Format feedback as text
        let feedbackText = 'RESUME FEEDBACK\n\n';
        
        // Add scores
        feedbackText += 'SCORES:\n';
        Object.entries(currentFeedback.scores).forEach(([category, score]) => {
            feedbackText += `${category.charAt(0).toUpperCase() + category.slice(1)}: ${score}/5\n`;
        });
        
        // Add summary
        feedbackText += '\nSUMMARY:\n';
        feedbackText += currentFeedback.summary + '\n\n';
        
        // Add strengths
        feedbackText += 'STRENGTHS:\n';
        if (currentFeedback.strengths && currentFeedback.strengths.length > 0) {
            currentFeedback.strengths.forEach((strength, index) => {
                feedbackText += `${index + 1}. ${strength}\n`;
            });
        } else {
            feedbackText += 'No specific strengths identified.\n';
        }
        
        // Add suggestions
        feedbackText += '\nSUGGESTIONS FOR IMPROVEMENT:\n';
        if (currentFeedback.suggestions && currentFeedback.suggestions.length > 0) {
            currentFeedback.suggestions.forEach((suggestion, index) => {
                feedbackText += `${index + 1}. ${suggestion}\n`;
            });
        } else {
            feedbackText += 'No specific suggestions available.\n';
        }
        
        // Copy to clipboard
        navigator.clipboard.writeText(feedbackText).then(() => {
            // Show success message
            const originalText = copyFeedbackBtn.innerHTML;
            copyFeedbackBtn.innerHTML = '<i class="fas fa-check me-2"></i>Copied!';
            
            // Reset button text after 2 seconds
            setTimeout(() => {
                copyFeedbackBtn.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            showAlert('Failed to copy feedback to clipboard. Please try again.', 'danger');
        });
    }

    // Download feedback report
    function downloadFeedbackReport() {
        if (!currentFeedback) return;
        
        // Show loading state
        const originalText = downloadReportBtn.innerHTML;
        downloadReportBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Generating...';
        downloadReportBtn.disabled = true;
        
        // Add API key to the request if provided
        const apiKey = getApiKey();
        const requestData = { feedback: currentFeedback };
        
        if (apiKey) {
            requestData.api_key = apiKey;
        }
        
        // Send feedback data to server to generate PDF
        fetch('/download-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.error || 'Failed to generate report'); });
            }
            return response.blob();
        })
        .then(blob => {
            // Create a download link and trigger it
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'resume_feedback_report.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert(error.message || 'Failed to generate PDF report. Please try again.', 'danger');
        })
        .finally(() => {
            // Reset button state
            downloadReportBtn.innerHTML = originalText;
            downloadReportBtn.disabled = false;
        });
    }
});
