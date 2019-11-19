$(document).ready(async function($) {
  $("#flipbtn").on("click", async function() {
    if (!isNaN(parseFloat($("#betinp").val()))) {
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
            `Winner winner! +${money_round(
              flipResult["info"]["updatedBits"] -
                parseFloat($("#bitsText").text())
            )} bits`
          );
        } else {
          $("#info").text(
            `You lost. -${money_round(
              parseFloat($("#bitsText").text()) -
                flipResult["info"]["updatedBits"]
            )} bits`
          );
        }

        $("#bitsText").text(parseFloat(flipResult["info"]["updatedBits"]));
        $("#verifytext").text(
          `ClientId: ${flipResult["info"]["clientId"]} Nonce: ${flipResult["info"]["nonce"]}  Result: ${flipResult["info"]["result"]}`
        );
      } else {
        $("#info").text("Error");
      }
    } else {
      $("#info").text("Error");
    }
  });

  $("#saveclient").on("click", async function() {
    let newClientId = $("#clientinp").val();
    const rawResponse = await fetch("/api/clientid", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ clientId: newClientId })
    });
    const flipResult = await rawResponse.json();
    if (flipResult["status"] === "success") {
      $("#saveclient").text("Saved");
      setTimeout(() => $("#saveclient").text("Save"), 1000);
    }
  });

  loadDb();
  loadDailySecret();
});

const loadDb = async () => {
  const rawResponse = await fetch("/api/info");
  const rawResult = await rawResponse.json();

  $("#accountText").text(rawResult["username"]);
  $("#bitsText").text(rawResult["bits"]);
  $("#clientinp").val(
    rawResult["clientId"].split(`${rawResult["discordId"]}_`)[1]
  );
  console.log(rawResult);
};

const loadDailySecret = async () => {
  const rawResponse = await fetch("/api/secrets");
  const rawResult = await rawResponse.json();

  if(rawResult.length === 0) {
    $("#dailysecrettext").text(`Yesterdays Server Seed: please wait for yesterday's server seed to be available.`)
  } else {
    $("#dailysecrettext").text(`Yesterdays Server Seed: ${rawResult[0]["secret"]}`)
  }
}

const money_round = num => {
  return Math.round(num * 1e12) / 1e12;
};

const showFair = () => {
  //#verify
  $("#verify").css("display") === "block"
    ? $("#verify").css("display", "none")
    : $("#verify").css("display", "block");
};

const showAdvanced = () => {
  //#advanced

  $("#advanced").css("display") === "block"
    ? $("#advanced").css("display", "none")
    : $("#advanced").css("display", "block");
};
