const config = require('./db-config.js');
const mysql = require('mysql');

config.connectionLimit = 10;
//Use connectionContract when querying contracts, assistance when querying assistance. See test examples below.
const connectionContract = mysql.createPool(config.Contracts);
const connectionAssistance = mysql.createPool(config.Assistance);



const contractSpendingAcrossYears = (req, res) => {
  const year1 = req.params.year1;
  const year2 = req.params.year2;
  const query = `
    SELECT potential_total_value_of_award
    FROM Awards
    WHERE action_date_fiscal_year >= ${year1} AND action_date_fiscal_year <= ${year2}
    LIMIT 100000
  `;

  connectionContract.query(query, (err, rows, fields) => {
    if (err) console.log(err);
    else res.json(rows);
  });
};

const assistanceSpendingAcrossYears = (req, res) => {
  const year1 = req.params.year1;
  const year2 = req.params.year2;
  const query = `
    SELECT total_obligated_amount
    FROM transaction
    WHERE action_date_fiscal_year >= ${year1} AND action_date_fiscal_year <= ${year2}
  `;

  connectionAssistance.query(query, (err, rows, fields) => {
    if (err) console.log(err);
    else res.json(rows);
  });
};

const contractSpendingAcrossYearsSum = (req, res) => {
  const year1 = req.params.year1;
  const year2 = req.params.year2;
  const query = `
    SELECT sum(potential_total_value_of_award)
    FROM Awards
    WHERE action_date_fiscal_year >= ${year1} AND action_date_fiscal_year <= ${year2}
  `;

  connectionContract.query(query, (err, rows, fields) => {
    if (err) console.log(err);
    else res.json(rows);
  });
};

const assistanceSpendingAcrossYearsSum = (req, res) => {
  const year1 = req.params.year1;
  const year2 = req.params.year2;
  const query = `
    SELECT sum(total_obligated_amount)
    FROM transaction
    WHERE action_date_fiscal_year >= ${year1} AND action_date_fiscal_year <= ${year2}
  `;

  connectionAssistance.query(query, (err, rows, fields) => {
    if (err) console.log(err);
    else res.json(rows);
  });
};

const contractAgencySpending = (req, res) => {
  const agency = req.params.agency;
  const query = `
    SELECT sum(potential_total_value_of_award), s.awarding_agency_name
    FROM Awards a JOIN Source s ON a.awarding_agency_code_award = s.awarding_agency_code
    WHERE s.awarding_agency_name LIKE '${agency}%' 
    GROUP BY s.awarding_agency_name
  `;

  connectionContract.query(query, (err, rows, fields) => {
    if (err) console.log(err);
    else res.json(rows);
  });
};

const assistanceAgencySpending = (req, res) => {
  const agency = req.params.agency;
  const query = `
    SELECT sum(t.total_obligated_amount)
    FROM agency a join transaction t on a.agency_code = t.awarding_agency_code
    WHERE a.agency_name LIKE '${agency}%'
  `;

  connectionAssistance.query(query, (err, rows, fields) => {
    if (err) console.log(err);
    else res.json(rows);
  });
};

const contractAgencySpendingYear = (req, res) => {
  const agency = req.params.agency;
  const year1 = req.params.year1;
  const year2 = req.params.year2;
  const query = `
    SELECT sum(potential_total_value_of_award), s.awarding_agency_name
    FROM Awards a JOIN Source s ON a.awarding_agency_code_award = s.awarding_agency_code
    WHERE s.awarding_agency_name LIKE '${agency}%' AND a.action_date_fiscal_year >= ${year1} 
    AND a.action_date_fiscal_year <= ${year2}
    GROUP BY s.awarding_agency_name
  `;

  connectionContract.query(query, (err, rows, fields) => {
    if (err) console.log(err);
    else res.json(rows);
  });
};

const assistanceAgencySpendingYear = (req, res) => {
  const agency = req.params.agency;
  const year1 = req.params.year1;
  const year2 = req.params.year2;
  const query = `
    SELECT sum(t.total_obligated_amount)
    FROM agency a join transaction t on a.agency_code = t.awarding_agency_code
    WHERE a.agency_name LIKE '${agency}%' AND t.action_date_fiscal_year >= ${year1} 
    AND t.action_date_fiscal_year <= ${year2}
  `;

  connectionContract.query(query, (err, rows, fields) => {
    if (err) console.log(err);
    else res.json(rows);
  });
};

const contractForeignSpending = (req, res) => {
  const query = `
    SELECT r.recipient_country_name,  SUM(a.potential_total_value_of_award) as total
    FROM Awards a JOIN Recipient r ON a.recipient_duns_award = r.recipient_duns
    WHERE r.recipient_country_name <> 'UNITED STATES'
    GROUP BY r.recipient_country_name
    ORDER BY total DESC
    `;

  connectionContract.query(query, (err, rows, fields) => {
    if (err) console.log(err);
    else res.json(rows);
  });
};


const contractStateSpending = (req, res) => {
  const query = `
    SELECT sum(a.potential_total_value_of_award) as sum, r.recipient_state_code
    FROM Awards a JOIN Recipient r ON a.recipient_duns_award = r.recipient_duns
    WHERE r.recipient_country_name= 'UNITED STATES'
    GROUP BY r.recipient_state_code
    ORDER by sum desc1
    `;

  connectionContract.query(query, (err, rows, fields) => {
    if (err) console.log(err);
    else res.json(rows);
  });
}; 

const contractLargestStateAward = (req, res) => {
  const agency = req.params.agency;
  const query = `
    WITH epaAwards AS (
    SELECT max(a.potential_total_value_of_award) as max, a.recipient_duns_award
    FROM Awards a JOIN Source s ON a.awarding_agency_code_award = s.awarding_agency_code
    WHERE s.awarding_agency_name like '${agency}%'
    )
    SELECT distinct r.recipient_state_code
    FROM epaAwards e JOIN Recipient r ON e.recipient_duns_award = r.recipient_duns
    `;

  connectionContract.query(query, (err, rows, fields) => {
    if (err) console.log(err);
    else res.json(rows);
  });
}; 

const contractCovidAward = (req, res) => {
  const query = `
    WITH covidAwards AS(
    SELECT *
    FROM Awards a JOIN Recipient r ON a.recipient_duns_award = r.recipient_duns
    WHERE r.organizational_type = 'CORPORATE NOT TAX EXEMPT' AND  a.action_date LIKE '3%' AND  a.action_date_fiscal_year = 2020
    )
    SELECT DISTINCT recipient_name
    FROM covidAwards
    WHERE potential_total_value_of_award >= 100000 AND recipient_country_name = 'United States'
    `;

  connectionContract.query(query, (err, rows, fields) => {
    if (err) console.log(err);
    else res.json(rows);
  });
}; 

const contractSpendingByYear = (req, res) => {
  const year1 = req.params.year1;
  const query = `
    SELECT sum(potential_total_value_of_award)
    FROM Awards
    WHERE action_date_fiscal_year = ${year1} 
  `;

  connectionContract.query(query, (err, rows, fields) => {
    if (err) console.log(err);
    else res.json(rows);
  });
};

const contractSourceToRecipient = (req, res) => {
  const source = req.params.source;
  const recipient = req.params.recipient;
  const query = `
    WITH sourceAwards AS (SELECT a.potential_total_value_of_award, recipient_duns_award
    FROM Awards a JOIN Source s on a.awarding_agency_code_award = s.awarding_agency_code
    WHERE s.awarding_agency_name LIKE '${source}%')
    
    SELECT sa.potential_total_value_of_award, sa.recipient_duns_award
    FROM sourceAwards sa JOIN Recipient r on sa.recipient_duns_award = r.recipient_duns
    WHERE r.recipient_name LIKE '${recipient}%'
    GROUP BY sa.recipient_duns_award
  `;

  connectionContract.query(query, (err, rows, fields) => {
    if (err) console.log(err);
    else res.json(rows);
  });
};

const contractRecipientType = (req, res) => {
  const recipientType = req.params.recipientType;
  const query = `
    SELECT sum(a.potential_total_value_of_award)
    FROM Awards a JOIN Recipient r ON a.recipient_duns_award = r.recipient_duns
    WHERE organizational_type LIKE '${recipientType}%'
  `;

  connectionContract.query(query, (err, rows, fields) => {
    if (err) console.log(err);
    else res.json(rows);
  });
};

const assistanceAreaofworkStateHighest = (req, res) => {
  const year = req.params.year;
  const query = `
  WITH SumQuery as (
    SELECT sum(t.total_obligated_amount) as sum, aow.cfda_number, aow.cfda_title, s.recipient_state_name
    FROM area_of_work aow
    JOIN transaction t ON aow.cfda_number = t.cfda_number
    JOIN award a on a.award_id_fain = t.award_id_fain
    JOIN recipient r on r.recipient_duns = a.recipient_duns
    JOIN state s ON r.recipient_state_code = s.recipient_state_code
    WHERE t.action_date_fiscal_year = ${year}
    GROUP BY aow.cfda_number, aow.cfda_title, s.recipient_state_name
    ORDER BY sum(t.total_obligated_amount) DESC
    )
    SELECT MAX(sum), recipient_state_name, cfda_title 
    FROM SumQuery
    GROUP BY recipient_state_name;
  `;

  connectionContract.query(query, (err, rows, fields) => {
    if (err) console.log(err);
    else res.json(rows);
  });
};

/*
SELECT sum(t.total_obligated_amount), aow.cfda_number, aow.cfda_title
FROM area_of_work aow
JOIN transaction t ON aow.cfda_number = t.cfda_number
JOIN award a on a.award_id_fain = t.award_id_fain
JOIN recipient r on r.recipient_duns = a.recipient_duns
JOIN state s ON r.recipient_state_code = s.recipient_state_code
WHERE s.recipient_state_name = 'Pennsylvania' and t.action_date_fiscal_year = 2019
GROUP BY aow.cfda_number, aow.cfda_title
ORDER BY sum(t.total_obligated_amount) DESC;
*/

module.exports = {
    contractSpendingAcrossYears: contractSpendingAcrossYears,
    contractAgencySpending: contractAgencySpending,
    contractSpendingAcrossYearsSum: contractSpendingAcrossYearsSum, 
    contractAgencySpendingYear: contractAgencySpendingYear,
    contractForeignSpending: contractForeignSpending,
    contractStateSpending: contractStateSpending,
    contractLargestStateAward: contractLargestStateAward,
    contractCovidAward: contractCovidAward,
    assistanceSpendingAcrossYears: assistanceSpendingAcrossYears,
    assistanceSpendingAcrossYearsSum: assistanceSpendingAcrossYearsSum,
    assistanceAgencySpending: assistanceAgencySpending,
    assistanceAgencySpendingYear: assistanceAgencySpendingYear,
    contractSpendingByYear: contractSpendingByYear,
    contractSourceToRecipient: contractSourceToRecipient,
    contractRecipientType: contractRecipientType,
    
};