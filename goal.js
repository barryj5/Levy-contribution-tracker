const params = new URLSearchParams(window.location.search)
const goalId = params.get("id")

const goalDetailName = document.getElementById("goalDetailName")
const goalDetailType = document.getElementById("goalDetailType")
const goalRingFill = document.getElementById("goalRingFill")
const goalPercentText = document.getElementById("goalPercentText")
const contributionsList = document.getElementById("contributionsList")

const addContributionButton = document.getElementById("addContributionButton")
const addContributionModal = document.getElementById("addContributionModal")
const contributionModalCancel = document.getElementById("contributionModalCancel")
const submitContributionButton = document.getElementById("submitContributionButton")
const contributionAmountInput = document.getElementById("contributionAmountInput")
const contributionDateInput = document.getElementById("contributionDateInput")
const contributionNoteInput = document.getElementById("contributionNoteInput")
const contributionImageInput = document.getElementById("contributionImageInput")

const HomeLink = document.getElementById("HomeLink")
const Goals = document.getElementById("SavedPage")
const Profile = document.getElementById("AddButton")
const logoutButton = document.getElementById("Logout")

logoutButton.onclick = async function(){
  const sure = confirm("Are you sure you want to log out?")

  if(!sure){
    return
  }

  await sb.auth.signOut()
  window.location.href = "login.html"
}

Profile.onclick = function(){
  window.location.href = "profile.html"
}

HomeLink.onclick = function(){
  window.location.href = "home.html"
}

Goals.onclick = function(){
  window.location.href = "goals.html"
}


let currentUserId = null
let currentGoal = null

async function loadGoalDetail(){
  const { data: { user } } = await sb.auth.getUser()

  if(!user){
    window.location.href = "login.html"
    return
  }

  currentUserId = user.id

  const { data: goal, error: goalError } = await sb
    .from("goals")
    .select("*")
    .eq("id", goalId)
    .single()

  if(goalError){
    alert(goalError.message)
    return
  }

  currentGoal = goal

  goalDetailName.textContent = goal.name
  goalDetailType.textContent = goal.goal_type

  await loadContributions()
}

async function loadContributions(){
  const { data: contributions, error } = await sb
    .from("contributions")
    .select("*")
    .eq("goal_id", goalId)
    .order("contribution_date", { ascending: false })

  if(error){
    alert(error.message)
    return
  }

  const total = contributions.reduce((sum, c) => sum + Number(c.amount), 0)
  const percent = Math.max(0, Math.min(100, (total / currentGoal.target_amount) * 100))

  const circumference = 2 * Math.PI * 50
  const offset = circumference - (percent / 100) * circumference

  goalRingFill.setAttribute("stroke-dasharray", circumference)
  goalRingFill.setAttribute("stroke-dashoffset", offset)
  goalPercentText.textContent = `${Math.round(percent)}%`

  if(percent >= 100){
    showCelebration()
  }

  contributionsList.innerHTML = ""

  for(const c of contributions){
    const item = document.createElement("div")
    item.className = "goalCard"
    item.innerHTML = `
      <p class="goalAmount">₦${Number(c.amount).toLocaleString()}</p>
      <p class="goalType">${c.contribution_date}${c.note ? " — " + c.note : ""}</p>
      ${c.image_url ? `<img src="${c.image_url}" style="width:100%; border-radius:8px; margin-top:8px;">` : ""}
    `
    contributionsList.appendChild(item)
  }
}

function showCelebration(){
  const celebration = document.createElement("div")
  celebration.className = "modalOverlay active"
  celebration.innerHTML = `
    <div class="modalBox" style="text-align:center;">
      <h3 style="font-size:28px;">🎉 Goal Reached! 🎉</h3>
      <p class="goalType">You hit your target for "${currentGoal.name}"</p>
      <button class="loginSubmitButton" id="closeCelebration">Nice!</button>
    </div>
  `
  document.body.appendChild(celebration)

  document.getElementById("closeCelebration").onclick = function(){
    celebration.remove()
  }
}

addContributionButton.onclick = function(){
  addContributionModal.classList.add("active")
}

contributionModalCancel.onclick = function(){
  addContributionModal.classList.remove("active")
}

submitContributionButton.onclick = async function(){
  const amount = Number(contributionAmountInput.value)
  const date = contributionDateInput.value
  const note = contributionNoteInput.value.trim()
  const file = contributionImageInput.files[0]

  if(!amount || !date){
    alert("Please enter a valid amount and date")
    return
  }

  let imageUrl = null

  if(file){
    const filePath = `${currentUserId}/${Date.now()}-${file.name}`

    const { error: uploadError } = await sb.storage
      .from("payment-proofs")
      .upload(filePath, file)

    if(uploadError){
      alert(uploadError.message)
      return
    }

    const { data: publicUrlData } = sb.storage
      .from("payment-proofs")
      .getPublicUrl(filePath)

    imageUrl = publicUrlData.publicUrl
  }

  const { error } = await sb.from("contributions").insert({
    user_id: currentUserId,
    goal_id: goalId,
    amount: amount,
    contribution_date: date,
    note: note,
    image_url: imageUrl
  })

  if(error){
    alert(error.message)
    return
  }

  addContributionModal.classList.remove("active")
  contributionAmountInput.value = ""
  contributionDateInput.value = ""
  contributionNoteInput.value = ""
  contributionImageInput.value = ""

  await loadContributions()
}

loadGoalDetail()