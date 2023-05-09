const {MidjourneyPuppet, options} = require("@d-lab/discord-puppet");

// See prerequisites at https://github.com/Draym/discord-puppet#prerequisite

(async () => {
  const config = options(
    process.env.DISCORD_USERNAME,
    process.env.DISCORD_PASSWORD,
    [],
    process.env.DISCORD_USER_DATA_DIR
  )
  const puppet = new MidjourneyPuppet(config)
  await puppet.start()
  await puppet.clickServer("PptrJourney")
  await puppet.clickChannel("art")

  const msg2 = await puppet.imagine(`Your awesome prompt here!`)
  console.log("MJY image: ", msg2)
})();

