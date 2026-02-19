const cache = new Map();
const TTL =  60000;

let undoStack = [];
let redoStack = [];
let isProgrammatic = false;


async function  fetchSuggestions(query) {

  const now = Date.now();

    if (cache.has(query)) {
        const cachedEntry = cache.get(query);

        if (now - cachedEntry.timestamp < TTL) {
            return cachedEntry.data; 
        } else {
            cache.delete(query); 
        }
    }
    resultsBox.innerHTML = "<div class='spinner'>Loading...</div>";

    try{
         const response = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${query}&limit=5&origin=*`);
         const data = await response.json();
         const suggestions= data[1];

         cache.set(query, {
            data: suggestions,
            timestamp: now
        });

        return suggestions;


    }catch(error) {
        resultsBox.innerHTML = "<div>Error loading results</div>";
        return[];
    }
   
}

const resultsBox = document.querySelector('.result-box');
const inputBox = document.getElementById('input-box');

let currentIndex = -1; 

document.addEventListener("click", function (e) {
  if (!e.target.closest(".search-box")) {
    resultsBox.innerHTML = '';
  }
});


function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
function saveToHistory(value) {
  let history = JSON.parse(localStorage.getItem("history")) || [];

  if (!history.includes(value)) {
    history.unshift(value);
  }

  history = history.slice(0, 5);

  localStorage.setItem("history", JSON.stringify(history));
}

function fuzzyMatch(keyword, input) {
  keyword = keyword.toLowerCase();
  input = input.toLowerCase();

  let inputIndex = 0;

  for (let char of keyword) {
    if (char === input[inputIndex]) {
      inputIndex++;
    }
  }

  return inputIndex === input.length;
}


const handleSearch = debounce( async function(e) {

  if (["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) return;

  const query = inputBox.value.trim();

  if (!query) {
    resultsBox.innerHTML = '';
    return;
  }

  const suggestions = await fetchSuggestions(query);
  const filtered = suggestions.filter(item =>
    fuzzyMatch(item, query)
  );

  display(filtered);

}, 300);

inputBox.addEventListener("keyup", handleSearch);

inputBox.addEventListener("input", () => {
  if (isProgrammatic) return;

  undoStack.push(inputBox.value);
  redoStack = [];
});

function highlightMatch(text, input) {
  const regex = new RegExp(`(${input})`, "gi");
  return text.replace(regex, "<b>$1</b>");
}

inputBox.addEventListener("focus", () => {
  if (!inputBox.value) {
    const history = JSON.parse(localStorage.getItem("history")) || [];
    display(history);
  }
});

function display(result) {
    currentIndex = -1;

     if (!result.length) {
        resultsBox.innerHTML = `<div class="no-results">No results found</div>`;
        return;
    }


    const content = result.map(item => {
    return `<li>${highlightMatch(item, inputBox.value)}</li>`;
    });


    resultsBox.innerHTML = "<ul>" + content.join('') + "</ul>";

    resultsBox.querySelectorAll("li").forEach(li => {
        li.addEventListener("click", () => {
            inputBox.value = li.textContent;
             saveToHistory(li.textContent);
            resultsBox.innerHTML = '';
        });
    });
}
document.addEventListener("keydown", function(e) {

    

     if (e.ctrlKey && e.key === "z") {
        e.preventDefault();

        if (undoStack.length > 1) {
            const current = undoStack.pop();
            redoStack.push(current);

            const previous = undoStack[undoStack.length - 1];

            isProgrammatic = true;
            inputBox.value = previous;
            isProgrammatic = false;

            handleSearch({ key: "" });
        }
        return;
    }

    if (e.ctrlKey && e.key === "y") {
        e.preventDefault();

        if (redoStack.length) {
            const next = redoStack.pop();
            undoStack.push(next);

            isProgrammatic = true;
            inputBox.value = next;
            isProgrammatic = false;

            handleSearch({ key: "" });
        }
        return;
    }
    const items = resultsBox.querySelectorAll("li");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
        currentIndex++;
        if (currentIndex >= items.length) {
            currentIndex = 0;
        }
        updateActive(items);
    }

    if (e.key === "ArrowUp") {
        currentIndex--;
        if (currentIndex < 0) {
            currentIndex = items.length - 1;
        }
        updateActive(items);
    }

    if (e.key === "Enter") {
        if (currentIndex >= 0) {
            const selected =  items[currentIndex].textContent;
            inputBox.value = selected;
            saveToHistory(selected);
            resultsBox.innerHTML = '';
        }
    }

});
function updateActive(items) {
    items.forEach(item => item.classList.remove("active"));
    items[currentIndex].classList.add("active");
}
