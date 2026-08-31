const emailInput = document.getElementById("emailInput")
const passwordInput = document.getElementById("passwordInput")
const displayNameInput = document.getElementById("displayNameInput")
const submitButton = document.getElementById("submitButton")
const toggleLink = document.getElementById("toggleLink")
const toggleText = document.getElementById("toggleText")
const formTitle = document.getElementById("formTitle")
const confirmPasswordInput = document.getElementById("confirmPasswordInput")
const confirmPasswordWrapper = document.getElementById("confirmPasswordWrapper")

let isSignUpMode = false

toggleLink.onclick = function(){
  isSignUpMode = !isSignUpMode

  if(isSignUpMode){
    formTitle.textContent = "Create an account"
    submitButton.textContent = "Sign Up"
    displayNameInput.style.display = "block"
    confirmPasswordWrapper.style.display = "block"
    toggleText.innerHTML = 'Already have an account? <span id="toggleLink">Sign in</span>'
  }else{
    formTitle.textContent = "Sign in to continue"
    submitButton.textContent = "Sign In"
    displayNameInput.style.display = "none"
    confirmPasswordWrapper.style.display = "none"
    toggleText.innerHTML = 'Don\'t have an account? <span id="toggleLink">Sign up</span>'
  }

  document.getElementById("toggleLink").onclick = toggleLink.onclick
}

submitButton.onclick = async function(){
  const email = emailInput.value.trim()
  const password = passwordInput.value

  if(!email || !password){
    alert("Please fill in email and password")
    return
  }

  if(isSignUpMode){
    const displayName = displayNameInput.value.trim()
    if(!displayName){
      alert("Please enter a display name")
      return
    }

    const confirmPassword = confirmPasswordInput.value
    if(password !== confirmPassword){
      alert("Passwords do not match")
      return
    }

    const { data, error } = await sb.auth.signUp({
      email: email,
      password: password
    })

    if(error){
      alert(error.message)
      return
    }

    if(data.user && data.user.identities && data.user.identities.length === 0){
      alert("An account with this email already exists. Please sign in instead.")
      return
    }

    const userId = data.user.id
    const { error: profileError } = await sb
      .from("profiles")
      .insert({ id: userId, display_name: displayName })

    if(profileError){
      alert(profileError.message)
      return
    }

    alert("Account created! Please check your email to confirm before signing in.")
    isSignUpMode = false
    formTitle.textContent = "Sign in to continue"
    submitButton.textContent = "Sign In"
    displayNameInput.style.display = "none"
    confirmPasswordWrapper.style.display = "none"
    toggleText.innerHTML = 'Don\'t have an account? <span id="toggleLink">Sign up</span>'
    document.getElementById("toggleLink").onclick = toggleLink.onclick

  }else{
    const { error } = await sb.auth.signInWithPassword({
      email: email,
      password: password
    })

    if(error){
      alert(error.message)
      return
    }

    window.location.href = "home.html"
  }
}

document.querySelectorAll(".togglePasswordIcon").forEach(function(icon){
  icon.onclick = function(){
    const targetInput = document.getElementById(icon.dataset.target)
    if(targetInput.type === "password"){
      targetInput.type = "text"
      icon.classList.remove("fa-eye")
      icon.classList.add("fa-eye-slash")
    }else{
      targetInput.type = "password"
      icon.classList.remove("fa-eye-slash")
      icon.classList.add("fa-eye")
    }
  }
})