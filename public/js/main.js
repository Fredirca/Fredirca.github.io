$(document).ready(async function($) {
  $("#flipbtn").on("click", async function() {
    if (!isNaN(parseInt($("#betinp").val()))) {
      let choice = document.getElementById("headsbtn").checked
        ? "Heads"
        : "Tails";

      let betAmount = $("#betinp").val();
      const rawResponse = await fetch("/api/flip", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ choice, betAmount })
      });
      const flipResult = await rawResponse.json();
      console.log(flipResult);
      if (flipResult["status"] === "success") {
        if (flipResult["info"]["result"] === choice) {
          $("#info").text(
            `Winner winner! +${flipResult["info"]["updatedBits"] -
              parseInt($("#bitsText").text())} bits`
          );
        } else {
          $("#info").text(
            `You lost. -${parseInt($("#bitsText").text()) -
              flipResult["info"]["updatedBits"]} bits`
          );
        }

        $("#bitsText").text(parseInt(flipResult["info"]["updatedBits"]));
        $("#verify").text(
          `Secret ${flipResult["info"]["secret"]} ClientId ${flipResult["info"]["clientId"]} Nonce ${flipResult["info"]["nonce"]}`
        );
      } else {
        $("#info").text("Error");
      }
    } else {
      $("#info").text("Error");
    }
  });

  loadDb();
});

const loadDb = async () => {
  const rawResponse = await fetch("/api/info");
  const rawResult = await rawResponse.json();

  $("#accountText").text(rawResult["username"]);
  $("#bitsText").text(rawResult["bits"]);
  console.log(rawResult);
};
