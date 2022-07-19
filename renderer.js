const start = document.getElementById('start')
const name = document.getElementById('name')
const out = document.getElementById('out')


start.addEventListener('click', async () => {
    const result = await window.electronAPI.getProcList(name.value);
    if (result.stdout != "ERROR") {
        var tableList = result.stdout;
        var hrow = out.insertRow();
        //hrow.innerHTML = "<tr><th></th><th>Image Name</th><th>PID</th><th>Services</th></tr>"
        for (var i=0;i<tableList.length;i++){
            var tableValues = tableList[i].trim().split(",");
            var row = out.insertRow();
            if (i>0){
                row.insertCell(0).innerHTML="<button type=\"button\" name=\"kill\">Close</button>";
                row.insertCell(1).innerHTML = tableValues.shift().trim();
                row.insertCell(2).innerHTML = tableValues.join(",").trim();
            } else {
                row.innerHTML = "<tr><td></td>"
                for (var j=0; j<2; j++){
                    row.innerHTML += "<td><b>"+tableValues[j].trim()+"</td></b>"
                }
                row.innerHTML += "</tr>"
            }
        }
    } else {
        out.innerText = result.stderr;
    }
})

out.addEventListener('click', async (evt) => {
    var node = evt.target || evt.srcElement;
    if (node.name == "kill") {
        const result = await window.electronAPI.killProcByPID(node.parentElement.parentElement.cells[1].innerText);
        if (result.stdout != "ERROR"){
            node.parentElement.parentElement.remove();
        } else {
            alert(result.stderr);
        }
    }
})

// Get the modal
var modal = document.getElementById("myModal");

// Get the button that opens the modal
var btn = document.getElementById("myBtn");
var search = document.getElementById("search");
var searchVal = document.getElementById("searchVal")

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal
btn.onclick = function() {
  modal.style.display = "block";
}
search.onclick = function() {
    //modal.style.display = "none";
    window.find(searchVal.value);
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}
