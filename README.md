# news-access

This was published as part of the following paper. Cite this paper if you use this.

Nisarg Jhaveri, Manish Gupta, and Vasudeva Varma. 2018. A Workbench for Rapid Generation of Cross-Lingual Summaries. In *Proceedings of the Eleventh International Conference on Language Resources and Evaluation (LREC-2018)*.

```
@inproceedings{jhaveri2018workbench,
  title={A Workbench for Rapid Generation of Cross-Lingual Summaries},
  author={Jhaveri, Nisarg and Gupta, Manish and Varma, Vasudeva},
  booktitle={Proceedings of the Eleventh International Conference on Language Resources and Evaluation (LREC-2018)},
  year={2018},
  isbn = {979-10-95546-00-9},
}
```

## Installation and setup
1. Setup [Node.js](https://nodejs.org/) with npm.
2. Install npm dependencies by running `npm install`.
3. Copy `config-sample.json` to `config.json` wherever needed, and adjust the configurations.

## External dependencies
- mongodb
- python2, with NLTK properly setup
- libicu-dev/libicu-devel
- Modified G-Flow, with `run.sh` script (optional)
- Lin and Bilmes implementation setup (optional)

## Run
Once you're done with the setup, you can run the system with the following command.

```$ node server/```
