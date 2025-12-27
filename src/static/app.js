document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) throw new Error(`Failed to load: ${response.status}`);
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select (keep default placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participants = Array.isArray(details.participants) ? details.participants : [];

        // Clear any existing content and build the card using safe DOM APIs
        activityCard.innerHTML = "";

        // Title
        const titleEl = document.createElement("h4");
        titleEl.textContent = name;
        activityCard.appendChild(titleEl);

        // Description
        const descP = document.createElement("p");
        descP.textContent = details.description;
        activityCard.appendChild(descP);

        // Schedule
        const scheduleP = document.createElement("p");
        const scheduleStrong = document.createElement("strong");
        scheduleStrong.textContent = "Schedule:";
        scheduleP.appendChild(scheduleStrong);
        scheduleP.appendChild(document.createTextNode(" " + details.schedule));
        activityCard.appendChild(scheduleP);

        // Availability
        const availabilityP = document.createElement("p");
        const availabilityStrong = document.createElement("strong");
        availabilityStrong.textContent = "Availability:";
        availabilityP.appendChild(availabilityStrong);
        availabilityP.appendChild(document.createTextNode(" " + spotsLeft + " spots left"));
        activityCard.appendChild(availabilityP);

        // Participants header
        const participantsHeaderP = document.createElement("p");
        const participantsStrong = document.createElement("strong");
        participantsStrong.textContent = "Participants:";
        participantsHeaderP.appendChild(participantsStrong);
        activityCard.appendChild(participantsHeaderP);

        if (participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";

          participants.forEach((p) => {
            const li = document.createElement("li");

            const emailSpan = document.createElement("span");
            emailSpan.className = "participant-email";
            emailSpan.textContent = p;
            li.appendChild(emailSpan);

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-btn";
            deleteBtn.title = "Remove participant";
            deleteBtn.setAttribute("aria-label", "Remove " + p);
            deleteBtn.dataset.activity = name;
            deleteBtn.dataset.email = p;
            deleteBtn.textContent = "🗑️";
            li.appendChild(deleteBtn);

            ul.appendChild(li);
          });

          activityCard.appendChild(ul);
        } else {
          const noParticipantsP = document.createElement("p");
          noParticipantsP.className = "no-participants";
          noParticipantsP.textContent = "No participants yet.";
          activityCard.appendChild(noParticipantsP);
        }
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
      // show an inline message as well
      messageDiv.textContent = "Failed to load activities.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
    }
  }

  // Unregister a participant
  async function unregisterParticipant(activity, email) {
    try {
      const response = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        messageDiv.classList.remove("hidden");
        // Refresh activities to reflect changes
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Failed to remove participant";
        messageDiv.className = "message error";
        messageDiv.classList.remove("hidden");
      }

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      console.error("Error unregistering participant:", error);
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
    }
  }

  // Event delegation for delete buttons
  activitiesList.addEventListener("click", (event) => {
    const target = event.target;
    if (target && target.classList.contains("delete-btn")) {
      const email = target.dataset.email;
      const activity = target.dataset.activity;
      unregisterParticipant(activity, email);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        // refresh activity list so participants/availability update
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
