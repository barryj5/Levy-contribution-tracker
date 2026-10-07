const goalsGrid = document.getElementById("goalsGrid")
const completedSection = document.getElementById("completedSection")
const newGoalButton = document.getElementById("newGoalButton")
const newGoalModal = document.getElementById("newGoalModal")
const modalCancel = document.getElementById("modalCancel")
const createGoalButton = document.getElementById("createGoalButton")
const goalNameInput = document.getElementById("goalNameInput")
const goalTypeInput = document.getElementById("goalTypeInput")
const goalAmountInput = document.getElementById("goalAmountInput")
const homePage = document.getElementById("home")
const Profile = document.getElementById("AddButton")
const logoutButton = document.getElementById("Logout")

logoutButton.onclick = async function(){
  const sure = confirm("Are you sure you want to log out?")
  if(!sure){ return }
  await sb.auth.signOut()
  window.location.href = "login.html"
}

Profile.onclick = function(){
  window.location.href = "profile.html"
}

homePage.onclick = function(){
  window.location.href = "home.html"
}

async function loadGoals(){
  const { data: { user } } = await sb.auth.getUser()

  if(!user){
    window.location.href = "login.html"
    return
  }

  const { data: goals, error } = await sb
    .from("goals")
    .select("*")
    .eq("user_id", user.id)

  if(error){
    alert(error.message)
    return
  }

  goalsGrid.innerHTML = ""
  completedSection.innerHTML = ""

  let activeCount = 0

  for(const goal of goals){
    const { data: contributions } = await sb
      .from("contributions")
      .select("*")
      .eq("goal_id", goal.id)
      .order("contribution_date", { ascending: false })

    const total = (contributions || []).reduce((sum, c) => sum + Number(c.amount), 0)
    const percent = Math.max(0, Math.min(100, (total / goal.target_amount) * 100))

    if(percent >= 100){
      completedSection.appendChild(buildCompletedBlock(goal, total, contributions))
    }else{
      activeCount++
      goalsGrid.appendChild(buildGoalCard(goal, total, percent))
    }
  }

  newGoalButton.style.display = activeCount >= 5 ? "none" : "block"
}

function buildGoalCard(goal, total, percent){
  const card = document.createElement("div")
  card.className = "goalCard"
  card.innerHTML = `
    <h3 class="goalName">${goal.name}</h3>
    <p class="goalType">${goal.goal_type}</p>
    <p class="progressLabel">Progress</p>
    <h4 class="progressPercent">${Math.round(percent)}%</h4>
    <progress value="${percent}" max="100" class="goalProgress"></progress>
    <p class="goalAmount">₦${total.toLocaleString()} / ₦${Number(goal.target_amount).toLocaleString()}</p>
  `
  card.onclick = function(){
    window.location.href = `goal.html?id=${goal.id}`
  }
  return card
}

function buildCompletedBlock(goal, total, contributions){
  const block = document.createElement("div")
  block.className = "goalCard"
  block.style.marginBottom = "20px"

  let historyHTML = ""
  for(const c of contributions){
    historyHTML += `<p class="goalType">₦${Number(c.amount).toLocaleString()} — ${c.contribution_date}${c.note ? " — " + c.note : ""}</p>`
  }

  block.innerHTML = `
    <h3 class="goalName">${goal.name} ✅</h3>
    <p class="goalAmount">₦${total.toLocaleString()} / ₦${Number(goal.target_amount).toLocaleString()}</p>
    ${historyHTML}
  `
  return block
}

newGoalButton.onclick = function(){
  newGoalModal.classList.add("active")
}

modalCancel.onclick = function(){
  newGoalModal.classList.remove("active")
}

createGoalButton.onclick = async function(){
  const name = goalNameInput.value.trim()
  const goalType = goalTypeInput.value
  const amount = Number(goalAmountInput.value)

  if(!name || !amount || amount <= 0){
    alert("Please fill in a valid goal name and amount")
    return
  }

  const { data: { user } } = await sb.auth.getUser()

  if(!user){
    alert("You must be logged in")
    return
  }

  const { error } = await sb.from("goals").insert({
    user_id: user.id,
    name: name,
    goal_type: goalType,
    target_amount: amount
  })

  if(error){
    alert(error.message)
    return
  }

  newGoalModal.classList.remove("active")
  goalNameInput.value = ""
  goalAmountInput.value = ""
  loadGoals()
}

loadGoals()