const Data_Processing = require('./DataProcessing.js');

const main = async () => {
  const process = new Data_Processing();
  process.load_CSV('Raw_User_Data');
  process.format_data();
  process.clean_data();
  console.log(process.most_common_surname());
  console.log(process.youngest_dr());
  console.log(process.most_common_month());
  console.log(process.percentage_titles());
  console.log(process.percentage_altered());
}

main()