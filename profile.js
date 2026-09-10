const homePage = document.getElementById("home")
const goalsPage = document.getElementById("SavedPage")
const logoutButton = document.getElementById("Logout")
const profileEmail = document.getElementById("profileEmail")
const displayNameInput = document.getElementById("displayNameInput")
const saveNameButton = document.getElementById("saveNameButton")

let currentUserId = null

homePage.onclick = function(){
  window.location.href = "home.html"
}

goalsPage.onclick = function(){
  window.location.href = "goals.html"
}

logoutButton.onclick = async function(){
  const sure = confirm("Are you sure you want to log out?")

  if(!sure){
    return
  }

  await sb.auth.signOut()
  window.location.href = "login.html"
}

async function loadProfile(){
  const { data: { user } } = await sb.auth.getUser()

  if(!user){
    window.location.href = "login.html"
    return
  }

  currentUserId = user.id
  profileEmail.textContent = user.email

  const { data: profile, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if(error){
    alert(error.message)
    return
  }

  displayNameInput.value = profile.display_name || ""
}

saveNameButton.onclick = async function(){
  const newName = displayNameInput.value.trim()

  if(!newName){
    alert("Display name cannot be empty")
    return
  }

  const { error } = await sb
    .from("profiles")
    .update({ display_name: newName })
    .eq("id", currentUserId)

  if(error){
    alert(error.message)
    return
  }

  alert("Name updated!")
}

loadProfile()