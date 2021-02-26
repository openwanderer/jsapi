/*
 * SimpleSequenceProvider
 *
 * A Simple provider of sequence data.
 * 
 * Assumes the sequence path is simply straight lines between the panoramas
 * in the sequence.
 *
 * Subsequent sequence providers will allow for more detailed routes joining 
 * panoramas, for example GPX traces or OpenStreetMap ways.
 */

class SimpleSequenceProvider {

    constructor(options) {
        this.sequenceUrl = options.sequenceUrl;
    }

    async getSequence(seqid) {
        const seqResponse = await fetch(this.sequenceUrl.replace('{id}', seqid));
        const json = await seqResponse.json();
        const result = { 
            seqid: seqid,
            panos: json
        };
        return result;
    }
}

export default SimpleSequenceProvider;
