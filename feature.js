let featureKeywords = [
    'How to use HTML and CSS',
    'Is Data Science still relevant?',
    'Project Ideas',
    'Tailwind CSS',
    'What are Promises in JavaScript',
    'How can I learn JavaScript',
    'Wordle',
    'Golang',
    'How to create a Responsive Website',
];

const resultsBox = document.querySelector('.result-box');
const inputBox = document.getElementById('input-box');

inputBox.onkeyup = function(){
    let result = [];
    let input = inputBox.value;
    if(input.length){
        result = featureKeywords.filter((keyword)=>{
            return keyword.toLowerCase().includes(input.toLowerCase());
        });
        console.log(result);
    }
    display(result);
    if(!result.length){
        resultsBox.innerHTML = '';
    }
}
 function display(result){
    const content = result.map((list)=>{
        return "<li onclick=selectInput(this)>" + list + "<li>";
    });

    resultsBox.innerHTML = "<ul>" + content.join('') + "<ul>";
 }
 function selectInput(list){
    inputBox.value = list.innerHTML;
    resultsBox.innerHTML = '';
 }