document.addEventListener('DOMContentLoaded', () => {
    const surveyForm = document.getElementById('survey-form');
    const questionsContainer = document.getElementById('questions-container');
    const surveyList = document.getElementById('survey-list');
    const participationForm = document.getElementById('participation-form');
    const selectSurvey = document.getElementById('select-survey');
    const surveyQuestionsContainer = document.getElementById('survey-questions-container');
    const resultsSurveySelect = document.getElementById('results-survey-select');
    const resultsContainer = document.getElementById('results-container');
  
    let surveys = JSON.parse(localStorage.getItem('surveys')) || [];
  
    function displaySurveys() {
      surveyList.innerHTML = '';
      surveys.forEach((survey, index) => {
        const surveyElement = document.createElement('li');
        surveyElement.textContent = `${survey.title} by ${survey.createdBy}`;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => {
          surveys.splice(index, 1);
          localStorage.setItem('surveys', JSON.stringify(surveys));
          displaySurveys();
          populateSurveyDropdown();
          populateResultsDropdown();
        });
        surveyElement.appendChild(deleteButton);
        surveyList.appendChild(surveyElement);
      });
    }
  
    function populateSurveyDropdown() {
      selectSurvey.innerHTML = '';
      resultsSurveySelect.innerHTML = '';
      surveys.forEach((survey, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = survey.title;
        selectSurvey.appendChild(option);
        resultsSurveySelect.appendChild(option.cloneNode(true)); // Same options for results dropdown
      });
    }
  
    function renderQuestions(questions) {
      surveyQuestionsContainer.innerHTML = '';
      questions.forEach((question, index) => {
        const questionElement = document.createElement('div');
        questionElement.classList.add('question');
        questionElement.innerHTML = `<h3>${question.text}</h3>`;
        
        if (question.type === 'multiple-choice') {
          questionElement.innerHTML += question.options.map((option, idx) =>
            `<div><input type="radio" name="answer-${index}" value="${option}" id="option${index}-${idx}"><label for="option${index}-${idx}">${option}</label></div>`
          ).join('');
        } else if (question.type === 'text') {
          questionElement.innerHTML += `<input type="text" name="answer-${index}" required>`;
        } else if (question.type === 'rating') {
          questionElement.innerHTML += `
            <select name="answer-${index}">
              ${[1, 2, 3, 4, 5].map(num => `<option value="${num}">${num}</option>`).join('')}
            </select>
          `;
        }
        surveyQuestionsContainer.appendChild(questionElement);
      });
    }
  
    surveyForm.addEventListener('submit', (e) => {
      e.preventDefault();
  
      const title = document.getElementById('title').value;
      const description = document.getElementById('description').value;
      const userName = document.getElementById('userName').value;
  
      const questions = Array.from(questionsContainer.children).map(questionElement => {
        const text = questionElement.querySelector('input[name="question-text"]').value;
        const type = questionElement.querySelector('select[name="question-type"]').value;
        const options = Array.from(questionElement.querySelectorAll('input[name="option-text"]')).map(optionElement => optionElement.value);
        return new Question(text, type, options);
      });
  
      const newSurvey = new Survey(title, description, questions, userName);
      surveys.push(newSurvey);
      localStorage.setItem('surveys', JSON.stringify(surveys));
  
      displaySurveys();
      populateSurveyDropdown();
      surveyForm.reset();
      questionsContainer.innerHTML = '';
    });
  
    document.getElementById('add-question').addEventListener('click', () => {
      const questionDiv = document.createElement('div');
      questionDiv.classList.add('question-item');
      questionDiv.innerHTML = `
        <label for="question-text">Soru Metni:</label>
        <input type="text" name="question-text" required>
        <label for="question-type">Soru Türü:</label>
        <select name="question-type" required>
          <option value="multiple-choice">Çoktan Seçmeli</option>
          <option value="text">Yazılı Cevap</option>
          <option value="rating">Puanlama</option>
        </select>
        <div class="options-container">
          <!-- Seçenekler buraya eklenecek (sadece çoktan seçmeli için) -->
        </div>
        <button type="button" class="add-option">Seçenek Ekle</button>
      `;
      questionsContainer.appendChild(questionDiv);
  
      questionDiv.querySelector('.add-option').addEventListener('click', () => {
        if (questionDiv.querySelector('select[name="question-type"]').value === 'multiple-choice') {
          const optionInput = document.createElement('input');
          optionInput.type = 'text';
          optionInput.name = 'option-text';
          questionDiv.querySelector('.options-container').appendChild(optionInput);
        }
      });
    });
  
    selectSurvey.addEventListener('change', () => {
      const selectedSurveyIndex = selectSurvey.value;
      const survey = surveys[selectedSurveyIndex];
      if (survey) {
        renderQuestions(survey.questions);
      } else {
        surveyQuestionsContainer.innerHTML = '';
      }
    });
  
    participationForm.addEventListener('submit', (e) => {
      e.preventDefault();
  
      const selectedSurveyIndex = selectSurvey.value;
      const participantName = document.getElementById('participant-name').value;
      const survey = surveys[selectedSurveyIndex];
  
      if (!survey) return;
  
      const answers = Array.from(surveyQuestionsContainer.children).map((questionElement, index) => {
        const question = survey.questions[index];
        if (question.type === 'multiple-choice') {
          return questionElement.querySelector(`input[name="answer-${index}"]:checked`)?.value || '';
        } else if (question.type === 'text') {
          return questionElement.querySelector(`input[name="answer-${index}"]`).value;
        } else if (question.type === 'rating') {
          return questionElement.querySelector(`select[name="answer-${index}"]`).value;
        }
      });
  
      const response = new Response(participantName, answers);
      survey.responses.push(response);
      localStorage.setItem('surveys', JSON.stringify(surveys));
      alert('Yanıt başarıyla gönderildi!');
    });
  
    resultsSurveySelect.addEventListener('change', () => {
      const selectedSurveyIndex = resultsSurveySelect.value;
      const survey = surveys[selectedSurveyIndex];
  
      resultsContainer.innerHTML = '';
      if (survey) {
        survey.questions.forEach((question, index) => {
          const questionElement = document.createElement('div');
          questionElement.innerHTML = `<h3>${question.text}</h3>`;
          const responses = survey.responses.map(response => response.answers[index]);
          if (question.type === 'multiple-choice') {
            const counts = question.options.map(option => responses.filter(answer => answer === option).length);
            questionElement.innerHTML += `<ul>${counts.map((count, idx) => `<li>${question.options[idx]}: ${count}</li>`).join('')}</ul>`;
          } else if (question.type === 'text') {
            questionElement.innerHTML += `<ul>${responses.map(response => `<li>${response}</li>`).join('')}</ul>`;
          } else if (question.type === 'rating') {
            const counts = Array(5).fill(0).map((_, idx) => responses.filter(answer => parseInt(answer) === idx + 1).length);
            questionElement.innerHTML += `<ul>${counts.map((count, idx) => `<li>${idx + 1} yıldız: ${count}</li>`).join('')}</ul>`;
          }
          resultsContainer.appendChild(questionElement);
        });
      }
    });
  
    displaySurveys();
    populateSurveyDropdown();
    populateResultsDropdown();
  });
  
  class Survey {
    constructor(title, description, questions, createdBy) {
      this.title = title;
      this.description = description;
      this.questions = questions;
      this.createdBy = createdBy;
      this.responses = [];
    }
  }
  
  class Question {
    constructor(text, type, options = []) {
      this.text = text;
      this.type = type;
      this.options = options;
    }
  }
  
  class Response {
    constructor(userName, answers) {
      this.userName = userName;
      this.answers = answers;
    }
  }
  