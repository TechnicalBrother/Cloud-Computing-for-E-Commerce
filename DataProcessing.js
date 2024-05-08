const fs = require('fs');


class Data_Processing {
    constructor() {
        this.raw_user_data = [];
        this.formatted_user_data = [];
        this.cleaned_user_data = [];
    }

    load_CSV(fileName) {
        const path = `${fileName}.csv`;
        try {
            const data = fs.readFileSync(path, 'utf8');
            this.raw_user_data = data;
        } catch (err) {
        }
    }

    format_data() {
        const raw_user_data_copy = this.raw_user_data;
        this.formatted_user_data = raw_user_data_copy.replace(/\r\n/g, '\n').split('\n').map(row => row.split(',')).map((userDetails, index) => {
            const [fullName, dob, age, email] = userDetails;
            const names = fullName.split(' ');
            return {
                title: names[0],
                first_name: names[1],
                middle_name: names[2],
                surname: names[3],
                date_of_birth: dob,
                age: Number(age) ? Number(age) : age,
                email: email,
            }
        });

        const emailCount = {};
        const copy = this.formatted_user_data;
        this.formatted_user_data = copy.filter(item => item.first_name !== undefined).map((userDetails) => {
            const userDetailsCopy = userDetails
            this.fix_title(userDetailsCopy);
            this.fix_names(userDetailsCopy);
            this.fix_dob_and_age(userDetailsCopy);
            this.fix_email(userDetailsCopy, emailCount);

            // this.fix_dob_and_age(userDetailsCopy);
            // this.fix_email(userDetailsCopy, emailCount);
            return userDetailsCopy;
        });
    }

    clean_data() {
        const emailCount = {};
        const formatted_user_data_copy = this.formatted_user_data;
        this.cleaned_user_data = formatted_user_data_copy.map((userDetails) => {
            const userDetailsCopy = JSON.parse(JSON.stringify(userDetails));
            if (userDetailsCopy.title === "Dr.") {
                userDetailsCopy.title = "Dr";
            }
            // this.fix_title(userDetailsCopy);
            // this.fix_names(userDetailsCopy)
            this.fix_first_last_names(userDetailsCopy);
            this.fix_dob_and_age(userDetailsCopy, true);
            this.fix_email(userDetailsCopy, emailCount, true);
            return userDetailsCopy;
        })
    }

    fix_title(userDetails) {
        const availableTitles = ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Dr.'];
        if (!availableTitles.includes(userDetails.title)) {
            userDetails.surname = userDetails.middle_name;
            userDetails.middle_name = userDetails.first_name;
            userDetails.first_name = userDetails.title;
            userDetails.title = '';
        }
    }

    fix_names(userDetails) {
        if (!userDetails.surname) {
            userDetails.surname = userDetails.middle_name;
            userDetails.middle_name = '';

            // if (!userDetails.first_name) {
            //     const namePart = userDetails.email.split('@')[0];
            //     const [firstName, surname] = namePart.split('.');
            //     userDetails.first_name = firstName;
            //     userDetails.surname = surname;
            // }
        }
    }

    fix_first_last_names(userDetails) {
        if (!userDetails.first_name || !userDetails.surname) {
            const namePart = userDetails.email.split('@')[0];
            const [firstName, surname] = namePart.split('.');
            userDetails.first_name = firstName;
            userDetails.surname = surname;
        }
    }

    fix_dob_and_age(userDetails, forceAgeCheck) {

        function pad(number) {
            return number < 10 ? '0' + number : number;
        }

        let parsedDate;
        if (userDetails.date_of_birth.includes('/')) {
            const parts = userDetails.date_of_birth.split('/');
            const year = parts[2].length === 2 ? '19' + parts[2] : parts[2];
            parsedDate = new Date(year, parts[1] - 1, parts[0]);
        } else if (userDetails.date_of_birth.includes(' ')) {
            parsedDate = new Date(userDetails.date_of_birth);
        }

        userDetails.date_of_birth = pad(parsedDate.getDate()) + '/' + pad(parsedDate.getMonth() + 1) + '/' + parsedDate.getFullYear();

        const comparisonDate = new Date(2024, 1, 26);
        let age = comparisonDate.getFullYear() - parsedDate.getFullYear();
        const m = comparisonDate.getMonth() - parsedDate.getMonth();
        if (m < 0 || (m === 0 && comparisonDate.getDate() < parsedDate.getDate())) {
            age--;
        }

        if (age > 100) {
            age -= 100;
            const start = userDetails.date_of_birth.slice(0, userDetails.date_of_birth.length - 4);
            const end = userDetails.date_of_birth.slice(userDetails.date_of_birth.length - 2);
            userDetails.date_of_birth = start + '20' + end;
        }
        if (userDetails.age === "thirty-five") {
            userDetails.age = 35;
        }
        else if (!userDetails.age || typeof userDetails.age === 'string' || forceAgeCheck) {
            userDetails.age = age;
        }
    }

    fix_email(userDetails, emailCount, shouldFixName) {
        let baseEmail = `${userDetails.first_name}.${userDetails.surname}@example.com`;

        if (emailCount[baseEmail]) {
            emailCount[baseEmail]++;
            const parts = baseEmail.split('@');
            baseEmail = `${parts[0]}${emailCount[baseEmail]}@${parts[1]}`;
        } else {
            emailCount[baseEmail] = 1;
        }

        if (shouldFixName) {
            userDetails.email = baseEmail;
        }

    }

    most_common_surname() {
        const surnameCounts = {};
        let mostCommon = [];
        let maxCount = 0;
        this.cleaned_user_data.forEach(user => {
            const surname = user.surname;
            if (surnameCounts[surname]) {
                surnameCounts[surname]++;
            } else {
                surnameCounts[surname] = 1;
            }

            if (surnameCounts[surname] > maxCount) {
                mostCommon.push(surname);
                maxCount = surnameCounts[surname];
            }
        });

        return mostCommon;
    }

    average_age() {
        if (this.cleaned_user_data.length === 0) {
            return 0;
        }

        const totalAge = this.cleaned_user_data.reduce((sum, user) => sum + user.age, 0);

        const avgAge = totalAge / this.cleaned_user_data.length;

        return Number(avgAge.toFixed(1));
    }

    youngest_dr() {
        const doctors = this.cleaned_user_data.filter(user => user.title === 'Dr');

        if (doctors.length === 0) {
            return null;
        }

        const youngestDoctor = doctors.reduce((youngest, current) => {
            return (youngest.age < current.age) ? youngest : current;
        });

        const [localPart, domainPart] = youngestDoctor.email.split('@');
  
        // Use a regular expression to remove numbers from the local part
        const formattedLocalPart = localPart.replace(/[0-9]/g, '');
        
        // Reassemble the email
        youngestDoctor.email = `${formattedLocalPart}@${domainPart}`;
        return youngestDoctor;
    }

    most_common_month() {
        const monthCounts = {};
        let mostCommonMonth = '';
        let maxCount = 0;

        this.cleaned_user_data.forEach(user => {
            const month = user.date_of_birth.split('/')[1];

            if (monthCounts[month]) {
                monthCounts[month]++;
            } else {
                monthCounts[month] = 1;
            }

            if (monthCounts[month] > maxCount) {
                mostCommonMonth = month;
                maxCount = monthCounts[month];
            }
        });

        const monthNames = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        const commonMonthName = monthNames[parseInt(mostCommonMonth, 10) - 1];

        return commonMonthName;
    }

    percentage_titles() {
        const titleCounts = { 'Mr': 0, 'Mrs': 0, 'Miss': 0, 'Ms': 0, 'Dr': 0, '': 0 };
        const total = this.cleaned_user_data.length;
        const percentages = [];

        this.cleaned_user_data.forEach(user => {
            if (titleCounts.hasOwnProperty(user.title)) {
                titleCounts[user.title]++;
            } else {
                titleCounts['']++;
            }
        });

        const orderedTitles = ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', ''];
        orderedTitles.forEach(title => {
            let percentage = (titleCounts[title] / total) * 100;
            const roundedPercentage = Math.round(percentage % 1 === 0.5 ? ((percentage + 1) % 2 === 0 ? percentage + 1 : percentage) : percentage);
            percentages.push(roundedPercentage);
        });

        return percentages;
    }

    percentage_altered() {
        let totalValues = 0;
        let alteredValues = 0;
        this.cleaned_user_data.forEach((item, index) => {
            const correspondingItem = this.formatted_user_data[index];
            Object.keys(item).forEach(key => {
                totalValues++;
                if (item[key] !== correspondingItem[key]) {
                    alteredValues++;
                }
            });
        });

        const percentageAltered = (alteredValues / totalValues) * 100;

        const roundedPercentage = parseFloat(percentageAltered.toFixed(3));

        return roundedPercentage;
    }
}

modules.exports = Data_Processing;