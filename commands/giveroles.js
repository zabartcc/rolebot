const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed } = require('discord.js')

module.exports = {
  name: 'giveroles',
  description: 'Assign Roles from Linked Account',
  data: new SlashCommandBuilder()
    .setName('giveroles')
    .setDescription('Assign roles for channel access. Your Discord account must be linked on the VATUSA website.'),
  execute(interaction, id, res, g) {
    //Initialize Vars
    const { MessageEmbed } = require('discord.js'),
      axios = require('axios'),
      https = require('https'),
      guild = g ? g : interaction.guild

    let req = axios
    //Check for dev API
    if (process.env.API_URL.indexOf('dev') > -1) {
      req = axios.create({
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      })
    }

    //Make the API Call to determine user information
    req.get(process.env.API_URL + 'user/' + (interaction ? interaction.member.id : id) + '?d')
      .then(result => {
        const { status, data } = result
        if (status !== 200) {
          sendError(interaction, MessageEmbed, 'Unable to communicate with API.', res)
        } else {
          const user = data.data

          //Instantiate Variables
          const member = interaction ? interaction.member : guild.members.cache.get(id),
            ratings = {
              AFK: 'Inactive',
              SUS: 'Suspended',
              OBS: 'Observer',
              S1: 'Student 1',
              S2: 'Student 2',
              S3: 'Student 3',
              C1: 'Controller 1',
              C3: 'Controller 3',
              I1: 'Instructor 1',
              I3: 'Instructor 3',
              SUP: 'Supervisor',
              ADM: 'Administrator',
            }
          let roles = [],
            facStaff = [],
            zabStaff = false,
            guestController = false,
            newNick = member.nickname,
            nickChange = false,
            homeController = false,
            visitingController = false,
            isInstructor = false
          const thisFacility = 'ZAB'
          /*
                      if (member.permissions.has('ADMINISTRATOR')) {
                        const ownerName = interaction.guild.members.cache.get(interaction.guild.ownerId).nickname
                        return sendError(interaction, MessageEmbed, `Since you have an administrator role, you must contact the Server Owner (${ownerName}) to receive your roles.`, res, false, 'Administrator Roles')
                      }
          */
          //Determine Roles
          for (let i = 0; i < user.roles.length; i++) {
            //Roles Table
            const role = user.roles[i]
            if ((thisFacility === role.facility) && (role.role === 'ATM')) {
              roles.push('Air Traffic Manager')
              zabStaff = true
              facStaff.push('ATM')
            }
            if ((thisFacility === role.facility) && (role.role === 'DATM')) {
              roles.push('Deputy Air Traffic Manager')
              zabStaff = true
              facStaff.push('DATM')
            }
            if ((thisFacility === role.facility) && (role.role === 'TA')) {
              roles.push('Training Administrator')
              roles.push('Training Team')
              zabStaff = true
              facStaff.push('TA')
            }
            if ((thisFacility === role.facility) && (role.role === 'EC')) {
              roles.push('Events Coordinator')
              roles.push('Events Team')
              zabStaff = true
              facStaff.push('EC')
            }
            if ((thisFacility === role.facility) && (role.role === 'FE')) {
              roles.push('Facility Engineer')
              roles.push('Facilities Team')
              roles.push('Tech Team')
              zabStaff = true
              facStaff.push('FE')
            }
            if ((thisFacility === role.facility) && (role.role === 'WM')) {
              roles.push('Webmaster')
              roles.push('Web Team')
              roles.push('Tech Team')
              zabStaff = true
              facStaff.push('WM')
            }
            if ((thisFacility === role.facility) && (role.role === 'MTR')) {
              roles.push('Training Team')
            }
            if ((role.facility === 'ZHQ') && role.role.match(/US\d+/)) {
              roles.push('VATUSA Staff')
            }
            if ((this.Facility != role.facility) && (role.role === 'ATM')) {
              facStaff.push('ATM')
            }
            if ((this.Facility != role.facility) && (role.role === 'DATM')) {
              facStaff.push('DATM')
            }
            if ((this.Facility != role.facility) && (role.role === 'TA')) {
              facStaff.push('TA')
            }
            if ((this.Facility != role.facility) && (role.role === 'EC')) {
              facStaff.push('EC')
            }
            if ((this.Facility != role.facility) && (role.role === 'FE')) {
              facStaff.push('FE')
            }
            if ((this.Facility != role.facility) && (role.role === 'WM')) {
              facStaff.push('WM')
            }
            if ((role.role === 'SUP') || (role.role === 'ADM)) {
              roles.push('Supervisor')
            }
            if (role.role === 'ACE') {
              roles.push('ACE Team')
            }
          }

          //Set roles based on rating for home controllers
          if (user.facility === thisFacility) {
            homeController = true
            roles.push('Member')
            switch (user.rating_short) {
              case 'OBS': roles.push('Observer')
                break;
              case 'S1': roles.push('Student')
                break;
              case 'S2': roles.push('Student 2')
                break;
              case 'S3': roles.push('Senior Student')
                break;
              case 'I1': roles.push('Instructor'); roles.push('Training Team'); isInstructor = true
                break;
              case 'I3': roles.push('Instructor'); roles.push('Training Team'); isInstructor = true
                break;
              case 'C1': if(!isInstructor) { roles.push('Controller') }
                break;
              case 'C3': if(!isInstructor) { roles.push('Senior Controller') }
                break;
              case 'SUP': roles.push('Supervisor')
                break;
              case 'ADM': roles.push('Supervisor')
            }
          }

          //Determine if visiting controller
          for (let i = 0; i < user.visiting_facilities.length; i++) {
            //Visiting Facilities Table
            let visiting_facility = user.visiting_facilities[i].facility
            if (visiting_facility === thisFacility) {
              roles.push('Visitor')
              visitingController = true
            }
          }

          //Assign role based on visitor's home facility
          const neighbors = ['ZLA', 'ZDV', 'ZKC', 'ZFW', 'ZHU']
          if (neighbors.includes(user.facility)) {
            roles.push(user.facility)
          }

          //Assign role if not home nor visiting controller
          if (!homeController && !visitingController) {
            roles.push('ARTCC Guest')
            guestController = true
          }

          //Determine Nickname
          if (zabStaff) {
            newNick = `${user.fname} ${user.lname} | ${facStaff.join('/')}`
          }
          else if (homeController) {
            newNick = `${user.fname} ${user.lname} | ${user.rating_short}`
          }
          else if (facStaff.length > 0) {
            newNick = `${user.fname} ${user.lname} | ${user.facility} ${facStaff.join('/')}`
          }
          else if (visitingController || guestController) {
            newNick = `${user.fname} ${user.lname} | ${user.facility} ${user.rating_short}`
          }
          else {
            newNick = `${user.fname} ${user.lname}`
          }

          //Assign Nickname
          if ((newNick !== member.nickname) && !member.permissions.has('ADMINISTRATOR')) {
            nickChange = true
            member.setNickname(newNick, 'Roles Synchronization').catch(e => console.error(e))
          }
          
          //Everyone gets the "I Agree" role
          roles.push('I Agree')
          
          //Assign Roles
          let roleStr = '',
            excluded = ['Server Booster', 'VATGOV']
          member.roles.cache.forEach(role => {
            if (role.id !== guild.roles.everyone.id
              && excluded.indexOf(role.name) < 0
              && roles.indexOf(role.name) < 0)
              member.roles.remove(role).catch(e => console.error(e))
          })
          for (let i = 0; i < roles.length; i++) {
            const role = guild.roles.cache.find(role => role.name === roles[i])
            member.roles.add(role).catch(e => console.error(e))
            roleStr += `${role} `
          }
          if (res)
            return res.json({
              status: 'OK',
              msg: `Your roles have been assigned, ${newNick}!<br><em>${roles.join(', ')}</em>`
            })

          const embed = new MessageEmbed()
            // Set the title of the field
            .setTitle('Your roles have been assigned.')
            // Set the color of the embed
            .setColor(0x5cb85c)
            // Set the main content of the embed
            .setDescription(roleStr)
          embed.setFooter(nickChange ? `Your new nickname is: ${newNick}` : newNick)

          // Send the embed to the same channel as the message
          interaction.reply({ embeds: [embed] })
        }
      }
      )
      .catch(error => {
        console.error(error)
        if (error.response.status === 404) {
          sendError(interaction, MessageEmbed, 'Your Discord account is not linked on VATUSA or you are not in the VATUSA database. Link it here: https://vatusa.net/my/profile', res, false, 'Not Linked')
        } else sendError(interaction, MessageEmbed, error.data !== undefined ? error.data.toJSON() : 'Unable to communicate with API.', res)
      })
  }
}

function sendError(interaction, me, msg, res, footer = true, header = false) {
  if (res)
    return res.json({
      status: 'error',
      msg: msg
    })
  const embed = new me()
    // Set the title of the field
    .setTitle(header ? header : 'Error!')
    // Set the color of the embed
    .setColor(0xFF0000)
    // Set the main content of the embed
    .setDescription(msg)

  if (footer) embed.setFooter('Please try again later')
  // Send the embed to the same channel as the message
  interaction.reply({ embeds: [embed] })
}
