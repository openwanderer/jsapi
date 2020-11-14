/*
 * SimpleSequenceProvider
 *
 * A simple provider of sequence data.
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
            path: json.geometry.coordinates, 
            panos: json.properties.ids.map ( (id,i) => {
                return {
                    id: id,
                    lon: json.geometry.coordinates[i][0],
                    lat: json.geometry.coordinates[i][1],
                    altitude: 0
                }
            })
        }; 
        return result;
    }
}

export default SimpleSequenceProvider;
